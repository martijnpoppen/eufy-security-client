import { P2PClientProtocol } from "../session";
import { P2PDataType } from "../types";
import * as p2pUtils from "../utils";

jest.mock("../../logging", () => {
    const stub = { error: jest.fn(), debug: jest.fn(), info: jest.fn(), warn: jest.fn(), trace: jest.fn() };
    return new Proxy({}, { get: () => stub });
});

/**
 * _initialize() runs on EVERY disconnect, including each failed reconnect to a station that cannot be
 * reached. It used to generate a fresh forge RSA-1024 keypair each time — pure JS keygen whose heap
 * churn is never handed back to the OS, so an unreachable station walked the process' RSS up until
 * Homey killed the app. The key is only needed once a livestream is actually requested.
 */
describe("P2PClientProtocol video RSA key", () => {
    const session = (): P2PClientProtocol => {
        const s = Object.create(P2PClientProtocol.prototype) as P2PClientProtocol;
        Object.assign(s, {
            enableEmbeddedPKCS1Support: false,
            currentMessageState: { [P2PDataType.VIDEO]: { rsaKey: null } },
        });
        return s;
    };

    afterEach(() => jest.restoreAllMocks());

    it("is not generated while (re)initialising a session", () => {
        const keygen = jest.spyOn(p2pUtils, "getNewRSAPrivateKey");
        const s = session();

        // Stand in for the collaborators _initialize() drives; the point is that none of them, and
        // nothing else in the reconnect path, reaches for a keypair.
        Object.assign(s, {
            _clearMessageStateTimeouts: () => undefined,
            _clearMessageVideoStateTimeouts: () => undefined,
            messageStates: new Map(),
            messageVideoStates: new Map(),
            p2pSeqMapping: new Map(),
            lockAESKeys: new Map(),
            expectedSeqNo: {},
            initializeMessageBuilder: () => undefined,
            initializeMessageState: () => undefined,
            initializeStream: () => undefined,
        });
        (s as unknown as { _initialize: () => void })._initialize();

        expect(keygen).not.toHaveBeenCalled();
    });

    it("is generated on first request and reused afterwards", () => {
        const s = session();

        const first = s.getRSAPrivateKey();
        const second = s.getRSAPrivateKey();

        expect(first).not.toBeNull();
        expect(second).toBe(first);
    });
});
