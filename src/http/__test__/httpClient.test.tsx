import { createServer, IncomingMessage, Server, ServerResponse } from "node:http";
import { AddressInfo } from "node:net";
import { gzipSync } from "node:zlib";
import { HttpClient, HttpError } from "../httpClient";

type Handler = (req: IncomingMessage, res: ServerResponse, body: Buffer) => void;

describe("HttpClient", () => {
    let server: Server;
    let base: string;
    let handler: Handler;
    let requests: Array<{ method: string; url: string; headers: Record<string, unknown>; body: string }>;

    beforeAll(
        () =>
            new Promise<void>((done) => {
                server = createServer((req, res) => {
                    const chunks: Buffer[] = [];
                    req.on("data", (c) => chunks.push(c));
                    req.on("end", () => {
                        const body = Buffer.concat(chunks);
                        requests.push({
                            method: req.method!,
                            url: req.url!,
                            headers: req.headers as Record<string, unknown>,
                            body: body.toString(),
                        });
                        handler(req, res, body);
                    });
                });
                server.listen(0, "127.0.0.1", () => {
                    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
                    done();
                });
            })
    );

    afterAll(() => new Promise<void>((done) => server.close(() => done())));

    beforeEach(() => {
        requests = [];
        handler = (_req, res) => {
            res.writeHead(200, { "content-type": "application/json" });
            res.end(JSON.stringify({ code: 0, msg: "", data: { ok: true } }));
        };
    });

    it("joins a prefix url with a relative endpoint and parses JSON", async () => {
        const client = new HttpClient({ prefixUrl: base, responseType: "json" });
        const res = await client.request("v2/passport/profile");

        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({ code: 0, msg: "", data: { ok: true } });
        expect(requests[0].url).toBe("/v2/passport/profile");
    });

    it("treats the endpoint as absolute when the prefix is cleared", async () => {
        const client = new HttpClient({ prefixUrl: base });
        await client.request(`${base}/absolute`, { prefixUrl: "" });

        expect(requests[0].url).toBe("/absolute");
    });

    it("sends a JSON body with a content type and a length", async () => {
        const client = new HttpClient({ prefixUrl: base });
        await client.request("login", { method: "post", json: { email: "a@b.c" } });

        expect(requests[0].method).toBe("POST");
        expect(requests[0].body).toBe('{"email":"a@b.c"}');
        expect(requests[0].headers["content-type"]).toBe("application/json");
        expect(requests[0].headers["content-length"]).toBe("17");
    });

    it("sends a raw Buffer body untouched", async () => {
        const client = new HttpClient({ prefixUrl: base });
        await client.request("checkin", {
            method: "post",
            body: Buffer.from("binary-payload"),
            headers: { "Content-Type": "application/x-protobuf" },
            responseType: "buffer",
        });

        expect(requests[0].body).toBe("binary-payload");
        expect(requests[0].headers["content-type"]).toBe("application/x-protobuf");
    });

    it("returns a Buffer for responseType buffer and text for text", async () => {
        handler = (_req, res) => res.end("raw-bytes");
        const client = new HttpClient({ prefixUrl: base });

        expect((await client.request("a", { responseType: "buffer" })).body).toEqual(Buffer.from("raw-bytes"));
        expect((await client.request("a", { responseType: "text" })).body).toBe("raw-bytes");
    });

    it("decompresses a gzipped response", async () => {
        handler = (_req, res) => {
            res.writeHead(200, { "content-encoding": "gzip" });
            res.end(gzipSync(Buffer.from(JSON.stringify({ code: 0 }))));
        };
        const client = new HttpClient({ prefixUrl: base });

        expect((await client.request("a")).body).toEqual({ code: 0 });
    });

    it("lower-cases headers and lets a later spelling win, like got did", async () => {
        // HTTPApi seeds `Country` then setCountry() writes `country`; both must not be sent.
        const client = new HttpClient({
            prefixUrl: base,
            headers: { Country: "DE", country: "NL", "User-Agent": undefined },
        });
        await client.request("a");

        expect(requests[0].headers["country"]).toBe("NL");
        expect(requests[0].headers).not.toHaveProperty("user-agent");
    });

    it("merges headers into the defaults and lets an undefined value clear one", async () => {
        const client = new HttpClient({ prefixUrl: base, headers: { "X-Auth-Token": "old" } });
        client.mergeHeaders({ "X-Auth-Token": "new" });
        await client.request("a");
        expect(requests[0].headers["x-auth-token"]).toBe("new");

        client.mergeHeaders({ "X-Auth-Token": undefined });
        await client.request("a");
        expect(requests[1].headers).not.toHaveProperty("x-auth-token");
    });

    it("throws HttpError on a non-2xx by default and returns it when asked not to", async () => {
        handler = (_req, res) => {
            res.writeHead(403);
            res.end(JSON.stringify({ code: 403 }));
        };
        const client = new HttpClient({ prefixUrl: base });

        await expect(client.request("a")).rejects.toBeInstanceOf(HttpError);
        const res = await client.request("a", { throwHttpErrors: false });
        expect(res.statusCode).toBe(403);
        expect(res.body).toEqual({ code: 403 });
    });

    it("exposes the response on the thrown error, so a 401 can be recognised", async () => {
        handler = (_req, res) => {
            res.writeHead(401);
            res.end("{}");
        };
        const client = new HttpClient({ prefixUrl: base });

        await expect(client.request("a")).rejects.toMatchObject({ response: { statusCode: 401 } });
    });

    it("retries a retryable status for a retryable method, then succeeds", async () => {
        let calls = 0;
        handler = (_req, res) => {
            calls++;
            if (calls < 3) {
                res.writeHead(503);
                res.end("{}");
                return;
            }
            res.end(JSON.stringify({ code: 0 }));
        };
        const client = new HttpClient({
            prefixUrl: base,
            retry: { limit: 3, methods: ["GET", "POST"], statusCodes: [503], delayMultiplier: 0 },
        });

        expect((await client.request("a")).body).toEqual({ code: 0 });
        expect(calls).toBe(3);
    });

    it("does not retry a method outside the retry list", async () => {
        let calls = 0;
        handler = (_req, res) => {
            calls++;
            res.writeHead(503);
            res.end("{}");
        };
        const client = new HttpClient({
            prefixUrl: base,
            retry: { limit: 3, methods: ["GET"], statusCodes: [503], delayMultiplier: 0 },
        });

        await expect(client.request("a", { method: "post" })).rejects.toBeInstanceOf(HttpError);
        expect(calls).toBe(1);
    });

    it("runs beforeRequest once per attempt", async () => {
        const beforeRequest = jest.fn();
        handler = (_req, res) => {
            res.writeHead(503);
            res.end("{}");
        };
        const client = new HttpClient({
            prefixUrl: base,
            beforeRequest,
            retry: { limit: 2, methods: ["GET"], statusCodes: [503], delayMultiplier: 0 },
        });

        await expect(client.request("a")).rejects.toBeInstanceOf(HttpError);
        expect(beforeRequest).toHaveBeenCalledTimes(3);
    });

    it("lets afterResponse replay a request with a fresh token, without recursing", async () => {
        // Mirrors HTTPApi's 401 hook: invalidate, re-login, replay once with the new token.
        let calls = 0;
        handler = (req, res) => {
            calls++;
            if (req.headers["x-auth-token"] !== "good") {
                res.writeHead(401);
                res.end("{}");
                return;
            }
            res.end(JSON.stringify({ code: 0 }));
        };
        const afterResponse = jest.fn(async (response, retry) => {
            if (response.statusCode === 401) return retry({ headers: { "X-Auth-Token": "good" } });
            return response;
        });
        const client = new HttpClient({ prefixUrl: base, headers: { "X-Auth-Token": "stale" }, afterResponse });

        const res = await client.request("a");

        expect(res.body).toEqual({ code: 0 });
        expect(calls).toBe(2);
        expect(afterResponse).toHaveBeenCalledTimes(1); // the replay did NOT re-enter the hook
    });

    it("follows a redirect", async () => {
        handler = (req, res) => {
            if (req.url === "/start") {
                res.writeHead(302, { location: "/end" });
                res.end();
                return;
            }
            res.end(JSON.stringify({ code: 0, at: "end" }));
        };
        const client = new HttpClient({ prefixUrl: base });

        expect((await client.request("start")).body).toMatchObject({ at: "end" });
    });

    it("surfaces a connection failure as a rejection", async () => {
        const client = new HttpClient({ prefixUrl: "http://127.0.0.1:1" });
        await expect(client.request("a")).rejects.toBeInstanceOf(Error);
    });
});
