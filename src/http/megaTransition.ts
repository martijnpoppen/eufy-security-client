import { HTTPApi } from "./api";
import { MegaHTTPApi, megaLoginHash } from "./megaApi";
import { rootMainLogger } from "../logging";
import type { HTTPApiPersistentData, LoginOptions } from "./interfaces";
import type { EufySecurityConfig, EufySecurityPersistentData } from "../interfaces";
import { ResponseErrorCode } from "./types";
import { ensureError } from "../error";
import { getError } from "../utils";

/**
 * Everything specific to the transitional v6 "eufy_mega" backend lives in this single file so it can
 * be removed in one block once a native v6 data layer (the new library) takes over.
 *
 * {@link MegaTransition} is the connect coordinator: v6-first login, legacy as best-effort
 * afterwards, the app-ready signal fired exactly once at the end. It owns all the v6 state (mega
 * client, pending challenge, serialisation) and talks to {@link EufySecurity} only through the
 * narrow {@link MegaTransitionHost} surface, so neither file leaks the other's internals.
 *
 * For now v6 is used only for login + FCM push registration: a migrated account logs in there and
 * receives events over its push channel, while the data layer keeps using the legacy transport. The
 * data endpoints differ on v6 (signed/encrypted, different paths/bodies) and belong in the new lib,
 * so we deliberately do NOT route legacy endpoints through mega here.
 *
 * Nothing here modifies {@link MegaHTTPApi}: this layer only consumes its public API.
 */

/** The result of one v6 login attempt. */
export type MegaLoginResult = "ok" | "tfa_required" | "captcha_required" | "locked" | "failed";

/** Which backend a submitted 2FA code / captcha must be routed to. */
export type ChallengeSource = "mega" | "legacy";

/**
 * The narrow surface {@link MegaTransition} needs from {@link EufySecurity}. It is satisfied with a
 * small closure object (not `this`) so neither side has to expose private members nor import the
 * other — keeping the transition layer self-contained and removable.
 */
export interface MegaTransitionHost {
  readonly config: EufySecurityConfig;
  readonly persistentData: EufySecurityPersistentData;
  /** The live (legacy) transport, set once by {@link MegaTransition.createTransport}. */
  readonly api: HTTPApi;
  writePersistentData(): void;
  /** Re-emit the 2FA prompt to the consumer (ws / plugin). */
  emitTfaRequest(): void;
  /** Re-emit the captcha prompt to the consumer (ws / plugin). */
  emitCaptchaRequest(id: string, captcha: string): void;
  /** The original upstream `connect()` (login + trust device), unchanged. */
  legacyConnect(options?: LoginOptions): Promise<void>;
  /** Signal the app as connected (refresh + push + mqtt). Fired once at the end of the sequence. */
  onAPIConnect(): Promise<void>;
  onConnectionError(error: Error): void;
}

/**
 * Coordinates the v6-first login sequence. The v6 "eufy_mega" backend logs in first (it carries push
 * and is where the account is heading, but — for now — only push: it has no station/device fetching
 * of its own). The legacy backend remains the one that actually matters for the app: stations and
 * devices are fetched exclusively through it, so the app-ready signal still requires LEGACY to be
 * authenticated, even if v6 already succeeded — signalling "connected" off v6 alone would fire
 * refreshCloudData() against a still-unauthenticated legacy session and yield an empty device list.
 * Each backend has its OWN 2FA email + captcha; whichever asks records itself in
 * {@link pendingChallenge} so the code/captcha from the next connect() is routed to the backend that
 * asked for it. The app-ready signal fires ONCE per successful legacy login.
 */
export class MegaTransition {
  private readonly host: MegaTransitionHost;
  private megaApi?: MegaHTTPApi;
  /**
   * Which backend a submitted 2FA code / captcha must be routed to. Set when WE emit the challenge,
   * so the next connect({verifyCode|captcha}) goes to the backend that asked for it — no guessing.
   * `undefined` = no challenge outstanding (start a fresh sequence).
   */
  private pendingChallenge?: ChallengeSource;
  /** Whether the v6 login succeeded this sequence (gates signalling the app as connected). */
  private megaLoggedIn = false;
  /** Serialises connect(): concurrent calls await the in-flight one instead of racing the sequence. */
  private connectInProgress?: Promise<void>;
  /**
   * Set after a v6 login failure (e.g. account not yet migrated). Prevents further attempts within
   * this session — and on the next startup if persisted — so we never import `got`/`p-throttle`
   * for accounts that can't reach v6, which saves significant memory on Homey.
   */
  private megaLoginFailed = false;
  /** How long a persisted {@link MegaSession.login_failed} marker suppresses the v6 login for. */
  private static readonly LOGIN_FAILURE_RETRY_AFTER_MS = 24 * 60 * 60 * 1000;

  constructor(host: MegaTransitionHost) {
    this.host = host;
    // If a recent startup saved a login_failed marker with matching credentials, skip v6 this
    // session entirely. This avoids importing got/p-throttle (memory-heavy ESM packages) on every
    // restart when the account hasn't been migrated to the v6 backend yet.
    const saved = host.persistentData.megaApi;
    if (saved?.login_failed) {
      const currentHash = megaLoginHash(
        host.config.username,
        host.config.password,
        host.persistentData.openudid ?? ""
      );
      const credentialsUnchanged = !saved.login_hash || saved.login_hash === currentHash;
      // Eufy migrates accounts to the v6 backend over time, so a failure recorded once must not pin
      // the account to "legacy only" forever — that would permanently cost it v6 push notifications.
      // Re-try at most once a day; the memory saving is unaffected in practice since restarts are
      // far more frequent than that.
      const markerExpired =
        saved.login_failed_at !== undefined &&
        Date.now() - saved.login_failed_at >= MegaTransition.LOGIN_FAILURE_RETRY_AFTER_MS;
      if (credentialsUnchanged && !markerExpired) {
        this.megaLoginFailed = true;
        rootMainLogger.debug("v6: skipping mega login this session (recent failure persisted, credentials unchanged)");
      } else if (credentialsUnchanged) {
        rootMainLogger.debug("v6: persisted login failure has aged out, retrying the mega login");
      }
    }
  }

  /** Record that the LEGACY login asked for a code/captcha (called from the host's api-event hooks). */
  public recordLegacyChallenge(): void {
    this.pendingChallenge = "legacy";
  }

  /**
   * Build the live transport. Today this is just the upstream legacy {@link HTTPApi}; the v6 mega
   * client is created lazily on demand (login / push) via {@link getMegaApi}. Kept as a single
   * factory so the transport can be swapped here if v6 ever needs to drive data requests too.
   */
  public async createTransport(persistentHttpApi: HTTPApiPersistentData | undefined): Promise<HTTPApi> {
    return HTTPApi.initialize(
      this.host.config.country!,
      this.host.config.username!,
      this.host.config.password!,
      persistentHttpApi
    );
  }

  /**
   * Lazily create (and restore) the v6 mega client. The persisted session (token ~30 days) is
   * reused so normal startups need no extra login/2FA; it is dropped if the credentials changed.
   */
  public async getMegaApi(): Promise<MegaHTTPApi> {
    if (!this.megaApi) {
      this.megaApi = new MegaHTTPApi({
        ab: this.host.config.country ?? "US",
        osType: "android",
        phoneModel: this.host.config.trustedDeviceName,
        openudid: this.host.persistentData.openudid || undefined,
      });
      await this.megaApi.init();
      const saved = this.host.persistentData.megaApi;
      if (saved) {
        const currentHash = megaLoginHash(
          this.host.config.username,
          this.host.config.password,
          this.host.persistentData.openudid
        );
        if (saved.login_hash && saved.login_hash !== currentHash) {
          rootMainLogger.debug("v6: credentials changed since last login, ignoring stored mega session");
        } else {
          this.megaApi.restoreSession(saved);
        }
      }
    }
    return this.megaApi;
  }

  /**
   * Register the FCM token on the v6 backend, best-effort. No-ops with a log when there is no valid
   * v6 session yet (not-yet-migrated account); a v6 failure is swallowed so legacy push is unaffected.
   */
  public async registerMegaPushToken(token: string): Promise<boolean> {
    if (this.megaLoginFailed) return false;
    try {
      const mega = await this.getMegaApi();
      if (!mega.hasValidSession()) {
        rootMainLogger.debug("v6 push: no valid mega session yet, skipping register (legacy still active)");
        return false;
      }
      const result = await mega.registerPushToken(token);
      if (result.code === 0) {
        rootMainLogger.info("v6 push: FCM token registered on the eufy_mega backend");
        return true;
      }
      rootMainLogger.warn("v6 push: register_push_token returned a non-zero code", {
        code: result.code,
        msg: result.msg,
      });
      return false;
    } catch (err) {
      rootMainLogger.warn("v6 push: register failed (legacy push unaffected)", { error: getError(ensureError(err)) });
      return false;
    }
  }

  /**
   * Authenticate against the v6 backend.
   *  1. first call -> on `26052` triggers the email code and returns "tfa_required"; on a captcha
   *     challenge it emits "captcha request" and returns "captcha_required".
   *  2. with a code/captcha -> completes login; the session is persisted (token ~30 days) so later
   *     startups reuse it with no relogin/2FA.
   *
   * Backend-enforced lockout (too many incorrect / max login limit) is surfaced as "locked" so the
   * caller stops retrying instead of deepening the lockout.
   */
  public async loginMega(
    verifyCode?: string,
    captcha?: { captchaId: string; answer: string }
  ): Promise<MegaLoginResult> {
    // Skip v6 if a previous login failed — avoids importing got/p-throttle on non-migrated accounts.
    // A fresh verifyCode/captcha bypasses this so a user can explicitly retry after fixing their account.
    if (this.megaLoginFailed && !verifyCode && !captcha) return "failed";
    try {
      const mega = await this.getMegaApi();
      if (mega.hasValidSession() && !verifyCode && !captcha) return "ok";

      await mega.estimateDomain();
      await mega.keyExchange(mega.clusterHost("openapi"));
      const result = await mega.login(this.host.config.username!, this.host.config.password!, verifyCode, captcha);

      if (result.code === ResponseErrorCode.CODE_NEED_VERIFY_CODE) {
        await mega.sendVerifyCode();
        this.pendingChallenge = "mega";
        this.host.emitTfaRequest();
        rootMainLogger.info("v6 login: email 2FA required — call loginMega(code) with the received code");
        return "tfa_required";
      }
      if (
        result.code === ResponseErrorCode.LOGIN_NEED_CAPTCHA ||
        result.code === ResponseErrorCode.LOGIN_CAPTCHA_ERROR
      ) {
        const c = await mega.generateCaptcha();
        this.pendingChallenge = "mega";
        this.host.emitCaptchaRequest(c.captcha_id, c.item);
        rootMainLogger.info("v6 login: captcha required — call loginMega(undefined, {captchaId, answer})");
        return "captcha_required";
      }
      if (
        result.code === ResponseErrorCode.CODE_PASSWORD_TOO_MANY_INCORRECT ||
        result.code === ResponseErrorCode.CODE_PASSWORD_WRONG_FIVE_TIMES ||
        result.code === ResponseErrorCode.CODE_MAX_LOGIN_LIMIT
      ) {
        rootMainLogger.warn("v6 login temporarily locked by the backend — stop retrying", {
          code: result.code,
          msg: result.msg,
        });
        return "locked";
      }
      if (result.code !== 0) {
        rootMainLogger.warn("v6 login failed", { code: result.code, msg: result.msg });
        this.megaLoginFailed = true;
        this.persistLoginFailure();
        return "failed";
      }
      this.host.persistentData.megaApi = mega.exportSession(
        megaLoginHash(this.host.config.username, this.host.config.password, this.host.persistentData.openudid)
      );
      this.host.writePersistentData();
      rootMainLogger.info("v6 login: success, mega session persisted");
      return "ok";
    } catch (err) {
      rootMainLogger.error("v6 login error", { error: getError(ensureError(err)) });
      return "failed";
    }
  }

  /** Persist a login failure marker so the next startup skips v6 without importing got/p-throttle. */
  private persistLoginFailure(): void {
    try {
      const loginHash = megaLoginHash(
        this.host.config.username,
        this.host.config.password,
        this.host.persistentData.openudid ?? ""
      );
      // Merge — never replace. Overwriting the whole object here threw away a previously exported,
      // still usable v6 session (token, megaDomain, per-cluster ECDH identities) on what may well be
      // a transient failure, so an account that recovered had to redo the full handshake and, until
      // it did, lost v6 push.
      this.host.persistentData.megaApi = {
        ...this.host.persistentData.megaApi,
        ab: this.host.persistentData.megaApi?.ab ?? (this.host.config.country ?? "us").toLowerCase(),
        openudid: this.host.persistentData.openudid ?? this.host.persistentData.megaApi?.openudid ?? "",
        login_failed: true,
        login_failed_at: Date.now(),
        login_hash: loginHash,
      };
      this.host.writePersistentData();
    } catch {
      // best-effort, non-critical
    }
  }

  /** Serialised connect(): concurrent callers await the in-flight run instead of racing it. */
  public connect(options?: LoginOptions): Promise<void> {
    if (this.connectInProgress) return this.connectInProgress;
    this.connectInProgress = this.runConnect(options).finally(() => {
      this.connectInProgress = undefined;
    });
    return this.connectInProgress;
  }

  private async runConnect(options?: LoginOptions): Promise<void> {
    const megaCaptcha = options?.captcha
      ? { captchaId: options.captcha.captchaId, answer: options.captcha.captchaCode }
      : undefined;
    // Captured before Phase 1/2 touch anything, so Phase 3 can tell "legacy just connected during
    // this call" apart from "legacy was already connected coming in". Upstream's api.login() was
    // naturally idempotent this way — once the token was already valid it returned without
    // re-emitting "connect" — but nothing here reproduced that once login moved into runConnect().
    const wasLegacyConnected = this.host.api.isConnected();

    // A challenge is already outstanding and this call carries no answer for it — e.g. a caller-side
    // blind/automatic reconnect attempt fired while the consumer is still showing the prompt. Do
    // nothing: in particular, don't re-run loginMega()/legacyConnect() with no code/captcha, since
    // both backends respond to that by drawing a BRAND NEW challenge and re-emitting it, silently
    // replacing the one currently on screen before the user can answer it (the "captcha keeps getting
    // overwritten" symptom). Only a connect() call that actually supplies verifyCode/captcha may
    // proceed while a challenge is pending.
    if (this.pendingChallenge && !options?.verifyCode && !options?.captcha) return;

    // PHASE 1 — v6 first. Run it unless a challenge is currently outstanding for the LEGACY side.
    if (this.pendingChallenge !== "legacy") {
      const megaResult = await this.loginMega(options?.verifyCode, megaCaptcha);
      if (megaResult === "tfa_required" || megaResult === "captcha_required") {
        // loginMega already recorded pendingChallenge="mega" and prompted the consumer.
        return;
      }
      this.megaLoggedIn = megaResult === "ok";
      this.pendingChallenge = undefined;
    }

    // PHASE 2 — legacy afterwards, and NOT optional: stations and devices are fetched exclusively
    // through the legacy backend today. A code/captcha just used by mega is not valid here; the
    // legacy login emits its OWN tfa/captcha event (which records pendingChallenge="legacy" via the
    // host) and we wait for the next connect().
    if (!this.host.api.isConnected()) {
      const legacyOptions =
        this.pendingChallenge === "legacy"
          ? options
          : ({ ...options, verifyCode: undefined, captcha: undefined } as LoginOptions);
      this.pendingChallenge = undefined;
      await this.host.legacyConnect(legacyOptions);
      // legacyConnect may have recorded pendingChallenge="legacy" via the host's api-event hooks — keep
      // blocking Phase 3 until it's resolved, EVEN IF v6 already logged in: stations/devices are fetched
      // exclusively through the legacy backend today (v6 only carries login + push), so signalling
      // "connected" off v6 alone would fire onAPIConnect()/refreshCloudData() against a still-unauthenticated
      // legacy session and yield an empty device list. The prompt has already been emitted to the consumer
      // (emitTfaRequest/emitCaptchaRequest ran inside legacyConnect), so it stays visible while we wait.
      if (this.pendingChallenge === "legacy" && !this.host.api.isConnected()) return;
    }

    // PHASE 3 — both backends settled. Signal the app ONCE PER TRANSITION into the connected state.
    //
    // The legacy login is what gates this, NOT v6. v6 carries login + push registration only —
    // getStations()/getDevices() and every P2P path run off the legacy HTTPApi — so signalling
    // "connected" off a v6 session alone fires onAPIConnect()/refreshCloudData() against an
    // unauthenticated legacy session: houses, stations and devices all come back empty and the
    // consumer marks every paired device unavailable while being told it is connected. That silent
    // shape is much worse than a loud failure, so a legacy login that did not come up is reported as
    // a connection error even when v6 is perfectly happy. Revisit only once v6 actually serves the
    // device list.
    if (this.host.api.isConnected()) {
      if (wasLegacyConnected) {
        // Legacy was ALREADY connected before this call started — this connect() call did nothing
        // new (a redundant/repeated call, e.g. a consumer calling connect() from more than one place
        // "just to be sure"). Re-running onAPIConnect() here would re-fire refreshCloudData()/push/mqtt
        // for no reason on every single such call — wasteful, and multiple of these racing against
        // the same throttled legacy transport is a real way to end up with spurious empty
        // station/device lists. Mirrors upstream api.login()'s early-return-without-re-emitting
        // "connect" once the token was already valid.
        return;
      }
      // Deliberately NOT awaited. Upstream's pre-v6 connect() only ever awaited api.login(); the
      // "connect" event itself was driven by a plain, un-awaited api.on("connect", ...) listener, so
      // connect() always resolved to the caller before "connect" was emitted. Consumers rely on that
      // ordering — they commonly do `await eufyClient.connect(); eufyClient.on("connect", ...)`, i.e.
      // register the listener only after connect() resolves. If we awaited onAPIConnect() here (it
      // itself awaits refreshCloudData(), a network round-trip), connect() would resolve only AFTER
      // "connect" had already fired, and such a listener would permanently miss it.
      this.host.onAPIConnect().catch((err) => {
        rootMainLogger.error("connect: onAPIConnect failed", { error: getError(ensureError(err)) });
      });
    } else if (this.megaLoggedIn) {
      rootMainLogger.warn(
        "connect: v6 logged in but the legacy login did not — not signalling connected, the device list comes from legacy"
      );
      this.host.onConnectionError(new Error("Legacy login failed (v6 alone cannot serve stations or devices)"));
    } else {
      rootMainLogger.warn("connect: neither v6 nor legacy login succeeded — not signalling connected");
      this.host.onConnectionError(new Error("Login failed on both backends"));
    }
  }
}
