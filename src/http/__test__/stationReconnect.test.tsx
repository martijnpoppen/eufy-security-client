import { Station } from "../station";

jest.mock("../../logging", () => {
    const stub = { error: jest.fn(), debug: jest.fn(), info: jest.fn(), warn: jest.fn(), trace: jest.fn() };
    return new Proxy({}, { get: () => stub });
});

/**
 * A station that cannot be reached never reaches "connected", so close() used to leave its p2p lookup
 * running, and every lookup that timed out came back through onTimeout() and scheduled yet another
 * attempt — for ever, on a station the consumer had explicitly closed. Each of those cycles costs
 * memory that is never returned, which is how the app ended up killed for its memory use.
 */
describe("Station reconnect after close", () => {
    const makeStation = (p2p: { connected: boolean; connecting: boolean }) => {
        const close = jest.fn();
        const station = Object.create(Station.prototype) as Station;
        Object.assign(station, {
            rawStation: { station_sn: "T8410P202028315A" },
            terminating: false,
            reconnectTimeout: undefined,
            currentDelay: 0,
            p2pSession: {
                isConnected: () => p2p.connected,
                isConnecting: () => p2p.connecting,
                close,
            },
            emit: () => true,
            getSerial: () => "T8410P202028315A",
        });
        return { station, close };
    };

    it("closes a session that is still connecting, not just a connected one", () => {
        const { station, close } = makeStation({ connected: false, connecting: true });

        station.close();

        expect(close).toHaveBeenCalled();
    });

    it("does not schedule another reconnect once closed", () => {
        const { station } = makeStation({ connected: false, connecting: true });
        station.close();

        (station as unknown as { onTimeout: () => void }).onTimeout();

        expect((station as unknown as { reconnectTimeout?: NodeJS.Timeout }).reconnectTimeout).toBeUndefined();
    });

    it("still reconnects while the station is in normal use", () => {
        const { station } = makeStation({ connected: false, connecting: true });

        (station as unknown as { onTimeout: () => void }).onTimeout();

        const timer = (station as unknown as { reconnectTimeout?: NodeJS.Timeout }).reconnectTimeout;
        expect(timer).toBeDefined();
        clearTimeout(timer);
    });
});
