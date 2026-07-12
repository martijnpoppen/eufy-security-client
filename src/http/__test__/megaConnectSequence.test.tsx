jest.mock("../../logging", () => {
  const stub = { error: jest.fn(), debug: jest.fn(), info: jest.fn(), warn: jest.fn(), trace: jest.fn() };
  return new Proxy({}, { get: () => stub });
});

import { MegaTransition, MegaTransitionHost, MegaLoginResult } from "../megaTransition";

/**
 * Validates the v6-first connect() state machine (MegaTransition) without any network, by stubbing
 * its mega client (loginMega) and host (legacyConnect / onAPIConnect). Covers the invariants:
 *  - v6 first; legacy is best-effort and runs afterwards, but is the one that decides the app-ready
 *    signal: stations/devices are fetched exclusively through legacy today, so a legacy 2FA/captcha
 *    challenge blocks onAPIConnect EVEN IF v6 already logged in — firing "connected" off v6 alone
 *    would yield an empty device list. The challenge stays outstanding (pendingChallenge is
 *    preserved) so it is still visible and gets retried on the next connect()
 *  - a legacy login that fails OUTRIGHT (no challenge — e.g. decommissioned) does not block: there is
 *    nothing left to wait for, so v6 alone may still signal connected
 *  - the next code/captcha is routed to the backend that asked for it
 *  - a connect() call with no verifyCode/captcha while a challenge is outstanding is a no-op — it
 *    must NOT re-run the backend's login and draw (and re-emit) a brand new challenge, silently
 *    replacing the one the user is currently looking at
 *  - onAPIConnect fires exactly once, at the end, only if at least one login succeeded
 *  - concurrent connect() calls are serialised
 */

interface Harness {
  transition: MegaTransition;
  onAPIConnect: jest.Mock;
  loginMega: jest.Mock;
  legacyConnect: jest.Mock;
  onConnectionError: jest.Mock;
  state: { connected: boolean };
}

function makeHarness(opts: {
  megaResults: MegaLoginResult[]; // one per loginMega call
  legacy: (t: MegaTransition) => Promise<void>; // simulate the legacy login (may set challenge / connect)
}): Harness {
  const state = { connected: false };
  const onAPIConnect = jest.fn(async () => {});
  const onConnectionError = jest.fn();

  // The real EufySecurity.legacyConnect swallows its own errors; mirror that here.
  const legacyConnect = jest.fn(async () => {
    try {
      await opts.legacy(transition);
    } catch {
      /* legacy login failed — best-effort, ignored */
    }
  });

  const host = {
    config: {},
    persistentData: {},
    get api() {
      return { isConnected: () => state.connected } as never;
    },
    writePersistentData: jest.fn(),
    emitTfaRequest: jest.fn(),
    emitCaptchaRequest: jest.fn(),
    legacyConnect,
    onAPIConnect,
    onConnectionError,
  } as unknown as MegaTransitionHost;

  const transition = new MegaTransition(host);

  // Mirror the real loginMega: a tfa/captcha result records pendingChallenge="mega" before returning.
  const loginMega = jest.fn(async () => {
    const r = opts.megaResults.shift() ?? "ok";
    if (r === "tfa_required" || r === "captcha_required") {
      (transition as unknown as { pendingChallenge?: string }).pendingChallenge = "mega";
    }
    return r;
  });
  (transition as unknown as { loginMega: jest.Mock }).loginMega = loginMega;

  return { transition, onAPIConnect, loginMega, legacyConnect, onConnectionError, state };
}

const connect = (h: Harness, opts?: { verifyCode?: string; captcha?: { captchaId: string; captchaCode: string } }) =>
  h.transition.connect(opts as never);

describe("connect() v6-first state machine", () => {
  it("nominal: mega ok + legacy ok → onAPIConnect once", async () => {
    const h = makeHarness({
      megaResults: ["ok"],
      legacy: async () => {
        h.state.connected = true;
      },
    });
    await connect(h);
    expect(h.loginMega).toHaveBeenCalledTimes(1);
    expect(h.legacyConnect).toHaveBeenCalledTimes(1);
    expect(h.onAPIConnect).toHaveBeenCalledTimes(1);
  });

  it("connect() resolves before onAPIConnect() finishes (pre-v6 fire-and-forget contract)", async () => {
    // Consumers commonly do `await eufyClient.connect(); eufyClient.on("connect", handler)` — i.e.
    // they attach the "connect" listener only AFTER connect() resolves. That only works if connect()
    // resolves before onAPIConnect() (which emits "connect") has finished — exactly like the upstream
    // pre-v6 connect(), which only ever awaited api.login() and drove onAPIConnect() off a plain,
    // un-awaited api.on("connect", ...) listener. If connect() awaited onAPIConnect() to completion,
    // "connect" would already have fired by the time such a listener is attached, and it would be
    // missed forever.
    const h = makeHarness({
      megaResults: ["ok"],
      legacy: async () => {
        h.state.connected = true;
      },
    });
    let onAPIConnectFinished = false;
    let resolveOnAPIConnect: () => void = () => {};
    (h.onAPIConnect as jest.Mock).mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveOnAPIConnect = () => {
            onAPIConnectFinished = true;
            resolve();
          };
        })
    );

    await connect(h);
    expect(h.onAPIConnect).toHaveBeenCalledTimes(1); // it was started...
    expect(onAPIConnectFinished).toBe(false); // ...but connect() didn't wait for it to finish

    resolveOnAPIConnect();
  });

  it("mega needs 2FA → returns without legacy or onAPIConnect, pendingChallenge=mega", async () => {
    const h = makeHarness({ megaResults: ["tfa_required"], legacy: async () => {} });
    await connect(h);
    expect((h.transition as any).pendingChallenge).toBe("mega");
    expect(h.legacyConnect).not.toHaveBeenCalled();
    expect(h.onAPIConnect).not.toHaveBeenCalled();
  });

  it("mega needs captcha; a blind reconnect with no answer does NOT redraw/overwrite it", async () => {
    const h = makeHarness({ megaResults: ["captcha_required", "captcha_required"], legacy: async () => {} });
    await connect(h); // draws the captcha, pendingChallenge=mega
    expect(h.loginMega).toHaveBeenCalledTimes(1);

    await connect(h); // e.g. a consumer's periodic "are we connected yet?" retry, no captcha supplied
    expect(h.loginMega).toHaveBeenCalledTimes(1); // NOT called again — the shown captcha stays valid
    expect(h.legacyConnect).not.toHaveBeenCalled();
    expect(h.onAPIConnect).not.toHaveBeenCalled();
    expect((h.transition as any).pendingChallenge).toBe("mega");
  });

  it("mega needs captcha; a retry that supplies the answer proceeds normally", async () => {
    const h = makeHarness({ megaResults: ["captcha_required", "ok"], legacy: async () => {} });
    await connect(h);
    expect(h.loginMega).toHaveBeenCalledTimes(1);

    await connect(h, { captcha: { captchaId: "cid", captchaCode: "ANSWER" } });
    expect(h.loginMega).toHaveBeenCalledTimes(2);
    expect((h.transition as any).pendingChallenge).toBeUndefined();
  });

  it("legacy needs a challenge; a blind reconnect with no answer does NOT redraw/overwrite it", async () => {
    const h = makeHarness({
      megaResults: ["failed"],
      legacy: async (t) => {
        t.recordLegacyChallenge();
      },
    });
    await connect(h); // legacy draws its challenge, pendingChallenge=legacy
    expect(h.legacyConnect).toHaveBeenCalledTimes(1);

    await connect(h); // blind retry, no code/captcha supplied
    expect(h.legacyConnect).toHaveBeenCalledTimes(1); // NOT called again
    expect((h.transition as any).pendingChallenge).toBe("legacy");
  });

  it("legacy emits a challenge before mega has ever logged in → returns WITHOUT onAPIConnect", async () => {
    const h = makeHarness({
      megaResults: ["failed"],
      legacy: async (t) => {
        // emulate the api "tfa request" hook firing during the legacy login
        t.recordLegacyChallenge();
      },
    });
    await connect(h);
    expect(h.onAPIConnect).not.toHaveBeenCalled();
    expect((h.transition as any).pendingChallenge).toBe("legacy");
  });

  it("legacy emits a challenge even though mega already logged in → still blocks onAPIConnect (devices need legacy)", async () => {
    const h = makeHarness({
      megaResults: ["ok"],
      legacy: async (t) => {
        // emulate the api "tfa request"/"captcha request" hook firing during the legacy login
        t.recordLegacyChallenge();
      },
    });
    await connect(h);
    expect(h.onAPIConnect).not.toHaveBeenCalled();
    expect((h.transition as any).pendingChallenge).toBe("legacy");
  });

  it("routes the mega code to mega, then legacy code to legacy, onAPIConnect only once legacy is actually in", async () => {
    const h = makeHarness({
      megaResults: ["tfa_required", "ok"],
      legacy: async (t) => {
        if (h.legacyConnect.mock.calls.length === 1)
          t.recordLegacyChallenge(); // legacy asks on first try
        else h.state.connected = true; // legacy ok on second
      },
    });
    await connect(h); // -> pendingChallenge mega
    expect((h.transition as any).pendingChallenge).toBe("mega");
    expect(h.onAPIConnect).not.toHaveBeenCalled();

    await connect(h, { verifyCode: "MEGACODE" }); // mega ok -> legacy asks -> still not connected
    expect(h.loginMega).toHaveBeenLastCalledWith("MEGACODE", undefined);
    expect((h.transition as any).pendingChallenge).toBe("legacy");
    expect(h.onAPIConnect).not.toHaveBeenCalled();

    await connect(h, { verifyCode: "LEGACYCODE" }); // legacy ok -> done
    expect(h.onAPIConnect).toHaveBeenCalledTimes(1);
  });

  it("legacy captcha then 2FA in one login(), mega already logged in → still blocked until legacy's new challenge is answered", async () => {
    const h = makeHarness({
      megaResults: ["ok"],
      legacy: async (t) => {
        // captcha accepted, but server now wants a 2FA code
        t.recordLegacyChallenge();
      },
    });
    (h.transition as any).pendingChallenge = "legacy"; // we arrived here because legacy had asked the captcha
    (h.transition as any).megaLoggedIn = true; // mega already done in a previous call
    await connect(h, { captcha: { captchaId: "cid", captchaCode: "DdYE" } });
    expect(h.onAPIConnect).not.toHaveBeenCalled();
    // legacy's new 2FA challenge is recorded (and was already emitted to the consumer), not dropped
    expect((h.transition as any).pendingChallenge).toBe("legacy");
  });

  it("both logins fail → no onAPIConnect, emits connection error", async () => {
    const h = makeHarness({ megaResults: ["failed"], legacy: async () => {} });
    await connect(h);
    expect(h.onAPIConnect).not.toHaveBeenCalled();
    expect(h.onConnectionError).toHaveBeenCalledWith(expect.any(Error));
  });

  it("legacy decommissioned (mega ok, legacy throws) → onAPIConnect still fires", async () => {
    const h = makeHarness({
      megaResults: ["ok"],
      legacy: async () => {
        throw new Error("legacy gone");
      },
    });
    await connect(h);
    expect(h.onAPIConnect).toHaveBeenCalledTimes(1);
  });

  it("serialises concurrent connect() calls", async () => {
    let resolveMega: (v: MegaLoginResult) => void;
    const h = makeHarness({
      megaResults: [],
      legacy: async () => {
        h.state.connected = true;
      },
    });
    (h.loginMega as jest.Mock).mockImplementation(() => new Promise((r) => (resolveMega = r as never)));

    const p1 = connect(h);
    const p2 = connect(h); // should await the same in-flight run
    resolveMega!("ok");
    await Promise.all([p1, p2]);
    expect(h.loginMega).toHaveBeenCalledTimes(1);
    expect(h.onAPIConnect).toHaveBeenCalledTimes(1);
  });
});
