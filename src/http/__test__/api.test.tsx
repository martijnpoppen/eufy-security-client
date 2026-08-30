import { HTTPApi } from "../api";
import { InvalidCountryCodeError } from "../../error";

jest.mock("../../logging", () => ({
    rootHTTPLogger: { error: jest.fn(), debug: jest.fn(), info: jest.fn(), warn: jest.fn() },
    rootMainLogger: { error: jest.fn(), debug: jest.fn(), info: jest.fn() },
}));

// Mock the static method and private loadLibraries to avoid real network/dynamic imports
const getApiBaseSpy = jest
    .spyOn(HTTPApi, "getApiBaseFromCloud")
    .mockResolvedValue("https://security-app.eufylife.com");

const loadLibsSpy = jest
    .spyOn(HTTPApi.prototype as any, "loadLibraries")
    .mockResolvedValue(undefined);

describe("HTTPApi", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("initialize", () => {
        it("should create an instance with a valid country code", async () => {
            const api = await HTTPApi.initialize("DE", "test@test.com", "password123");
            expect(api).toBeInstanceOf(HTTPApi);
            expect(getApiBaseSpy).toHaveBeenCalledWith("DE");
            expect(loadLibsSpy).toHaveBeenCalled();
        });

        it("should accept any two letter country code", async () => {
            // Validation is deliberately length-only: Eufy accepts codes that are not ISO 3166-1
            // Alpha-2 (e.g. "UK"), and rejecting those locked those accounts out entirely.
            await expect(HTTPApi.initialize("XX", "test@test.com", "password123")).resolves.toBeInstanceOf(HTTPApi);
        });

        it("should throw InvalidCountryCodeError for country code longer than 2 chars", async () => {
            await expect(HTTPApi.initialize("DEU", "test@test.com", "password123")).rejects.toThrow(
                InvalidCountryCodeError,
            );
        });

        it("should not be connected after initialization", async () => {
            const api = await HTTPApi.initialize("DE", "test@test.com", "password123");
            expect(api.isConnected()).toBe(false);
        });
    });

    describe("login", () => {
        it("should emit connection error on failed login when force is true", async () => {
            const api = await HTTPApi.initialize("US", "test@test.com", "password123");
            const errorHandler = jest.fn();
            api.on("connection error", errorHandler);

            // Force login will try to call the request method which doesn't exist (loadLibraries was mocked)
            await api.login({ force: true });

            expect(errorHandler).toHaveBeenCalled();
        });

        it("should emit connect when token is valid and passport profile succeeds", async () => {
            const api = await HTTPApi.initialize("GB", "test@test.com", "password123");
            const connectHandler = jest.fn();
            api.on("connect", connectHandler);

            // Set a valid token so login skips the API call and goes to getPassportProfile
            (api as any).token = "valid-token";
            (api as any).tokenExpiration = new Date(Date.now() + 100000);
            (api as any).getPassportProfile = jest.fn().mockResolvedValue({ email: "test@test.com" });
            (api as any).scheduleRenewAuthToken = jest.fn();

            await api.login();

            expect(connectHandler).toHaveBeenCalled();
            expect(api.isConnected()).toBe(true);
        });

        it("should emit connection error when passport profile returns null", async () => {
            const api = await HTTPApi.initialize("FR", "test@test.com", "password123");
            const errorHandler = jest.fn();
            api.on("connection error", errorHandler);

            (api as any).token = "valid-token";
            (api as any).tokenExpiration = new Date(Date.now() + 100000);
            (api as any).getPassportProfile = jest.fn().mockResolvedValue(null);

            await api.login();

            expect(errorHandler).toHaveBeenCalled();
            expect(api.isConnected()).toBe(false);
        });

        it("should emit connection error when passport profile throws", async () => {
            const api = await HTTPApi.initialize("IT", "test@test.com", "password123");
            const errorHandler = jest.fn();
            api.on("connection error", errorHandler);

            (api as any).token = "valid-token";
            (api as any).tokenExpiration = new Date(Date.now() + 100000);
            (api as any).getPassportProfile = jest.fn().mockRejectedValue(new Error("Network error"));

            await api.login();

            expect(errorHandler).toHaveBeenCalled();
            expect(api.isConnected()).toBe(false);
        });

    describe("close", () => {
        // The token renewal job is a live timer holding a reference back to the HTTPApi and, through
        // it, the whole EufySecurity graph. It used to be filed under the fixed name "renewAuthToken"
        // in node-schedule's module level registry and was never cancelled, so every rebuilt client
        // (re-login, repair) leaked its predecessor and left a stale job armed under the same name.
        it("cancels the token renewal job and drops all listeners", async () => {
            const api = await HTTPApi.initialize("DE", "test@test.com", "password123");
            (api as any).tokenExpiration = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
            (api as any).scheduleRenewAuthToken();

            const job = (api as any).renewAuthTokenJob;
            expect(job).toBeDefined();
            expect(job.nextInvocation()).not.toBeNull();

            api.on("connect", () => undefined);
            api.close();

            expect(job.nextInvocation()).toBeNull();
            expect((api as any).renewAuthTokenJob).toBeUndefined();
            expect(api.listenerCount("connect")).toBe(0);
        });

        it("does not register the job under a shared name", async () => {
            const schedule = require("node-schedule");
            const api = await HTTPApi.initialize("DE", "test@test.com", "password123");
            (api as any).tokenExpiration = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
            (api as any).scheduleRenewAuthToken();

            // A named job stays reachable from node-schedule's global registry for the life of the
            // process, and a second client would silently replace the first one's entry.
            expect(schedule.scheduledJobs["renewAuthToken"]).toBeUndefined();
            api.close();
        });
    });

    describe("response code normalization", () => {
        // The Eufy cloud gateway started answering with the HTTP style success code `200` in the
        // response BODY instead of the historical `0`, while still returning a complete payload.
        // Every caller compares against CODE_OK (0), so without normalization a perfectly valid
        // response was read as a failure — which is what left `connected` false and made the
        // house/station/device lists come back empty.
        const respond = (api: HTTPApi, body: unknown) => {
            (api as any).requestEufyCloud = {
                request: jest.fn().mockResolvedValue({
                    statusCode: 200,
                    statusMessage: "OK",
                    headers: {},
                    body,
                }),
            };
        };

        it("maps a body code of 200 onto CODE_OK", async () => {
            const api = await HTTPApi.initialize("DE", "test@test.com", "password123");
            respond(api, { code: 200, msg: "", data: "encrypted" });

            const response = await api.request({ method: "get", endpoint: "v2/passport/profile" });

            expect(response.data.code).toBe(0);
        });

        it("leaves any other body code untouched", async () => {
            const api = await HTTPApi.initialize("DE", "test@test.com", "password123");
            respond(api, { code: 26006, msg: "invalid", data: undefined });

            const response = await api.request({ method: "get", endpoint: "v2/passport/profile" });

            expect(response.data.code).toBe(26006);
        });

        it("leaves non-object bodies untouched", async () => {
            const api = await HTTPApi.initialize("DE", "test@test.com", "password123");
            const buffer = Buffer.from("binary");
            respond(api, buffer);

            const response = await api.request({ method: "get", endpoint: "v1/some/binary", responseType: "buffer" });

            expect(response.data).toBe(buffer);
        });

        it("accepts a passport profile answered with code 200", async () => {
            const api = await HTTPApi.initialize("DE", "test@test.com", "password123");
            respond(api, { code: 200, msg: "", data: "encrypted" });
            (api as any).decryptAPIData = jest
                .fn()
                .mockReturnValue({ user_id: "uid", nick_name: "nick", email: "test@test.com" });

            await expect(api.getPassportProfile()).resolves.toMatchObject({ user_id: "uid" });
        });
    });

        it("should not login again if already connected with valid token", async () => {
            const api = await HTTPApi.initialize("DE", "test@test.com", "password123");
            const connectHandler = jest.fn();
            api.on("connect", connectHandler);

            (api as any).token = "valid-token";
            (api as any).tokenExpiration = new Date(Date.now() + 100000);
            (api as any).connected = true;

            await api.login();

            // Should not emit connect again since already connected
            expect(connectHandler).not.toHaveBeenCalled();
        });
    });
});