import { request as httpRequest, IncomingHttpHeaders, IncomingMessage, RequestOptions } from "node:http";
import { request as httpsRequest } from "node:https";
import { brotliDecompressSync, gunzipSync, inflateSync } from "node:zlib";
import { URL } from "node:url";

/**
 * A very small HTTP client over node's built-in `https`, covering exactly what this library asks of
 * an HTTP client: JSON/text/buffer responses, a prefix url, default headers, transparent
 * decompression, redirects, status-based retries with backoff, and a hook to re-authenticate and
 * replay a request.
 *
 * It exists for one reason: `got` costs ~12 MB of resident memory on top of an already loaded
 * process — a tenth of the entire memory budget a Homey app is allowed — while `node:https` and
 * `node:tls` are loaded anyway and cost ~0.4 MB more.
 */

export type ResponseType = "json" | "text" | "buffer";

export interface RetryOptions {
  /** Number of RETRIES (0 = try once). */
  limit?: number;
  /** Methods eligible for retry. Anything else is tried once. */
  methods?: string[];
  /** Status codes that count as retryable. */
  statusCodes?: number[];
  /** Multiplier applied to the computed exponential backoff. */
  delayMultiplier?: number;
}

export interface HttpRequestOptions {
  method?: string;
  headers?: Record<string, string | undefined>;
  /** Serialised as a JSON body, with the matching content-type. */
  json?: unknown;
  /** Raw body. Ignored when `json` is set. */
  body?: string | Buffer;
  responseType?: ResponseType;
  /** When true (the default) a non-2xx/3xx response throws {@link HttpError}. */
  throwHttpErrors?: boolean;
  retry?: RetryOptions;
  timeoutMs?: number;
  /** Prepended to a relative endpoint. Pass "" to treat the endpoint as an absolute url. */
  prefixUrl?: string;
}

export interface HttpResponse<T = any> {
  statusCode: number;
  statusMessage: string;
  headers: IncomingHttpHeaders;
  body: T;
  requestUrl: string;
}

export class HttpError extends Error {
  public readonly response: HttpResponse;
  constructor(response: HttpResponse) {
    super(`Response code ${response.statusCode} (${response.statusMessage})`);
    this.name = "HttpError";
    this.response = response;
  }
}

const DEFAULT_RETRY: Required<RetryOptions> = {
  limit: 0,
  methods: ["GET"],
  statusCodes: [408, 413, 429, 500, 502, 503, 504, 521, 522, 524],
  delayMultiplier: 1,
};

const REDIRECT_CODES = new Set([301, 302, 303, 307, 308]);
const MAX_REDIRECTS = 5;

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Lower-cases header names, dropping undefined values. Later keys win, so a lower-case
 * `country` set after a capitalised `Country` replaces it — the same collapsing `got` did, which
 * this library relies on (setCountry/setLanguage/setOpenUDID write the lower-case spellings).
 */
const normalizeHeaders = (
  ...sources: Array<Record<string, string | undefined> | undefined>
): Record<string, string> => {
  const out: Record<string, string> = {};
  for (const source of sources) {
    if (!source) continue;
    for (const [name, value] of Object.entries(source)) {
      if (value === undefined || value === null) continue;
      out[name.toLowerCase()] = String(value);
    }
  }
  return out;
};

const decompress = (raw: Buffer, encoding?: string): Buffer => {
  if (raw.length === 0) return raw;
  try {
    switch ((encoding ?? "").toLowerCase()) {
      case "gzip":
        return gunzipSync(raw);
      case "deflate":
        return inflateSync(raw);
      case "br":
        return brotliDecompressSync(raw);
      default:
        return raw;
    }
  } catch {
    // A server that mislabels the encoding is better served by the raw bytes than by an exception.
    return raw;
  }
};

const parseBody = (raw: Buffer, responseType: ResponseType): unknown => {
  if (responseType === "buffer") return raw;
  const text = raw.toString("utf8");
  if (responseType === "text") return text;
  if (text.length === 0) return undefined;
  return JSON.parse(text);
};

const resolveUrl = (endpoint: string, prefixUrl?: string): string => {
  if (!prefixUrl) return endpoint;
  return `${prefixUrl.replace(/\/+$/, "")}/${endpoint.replace(/^\/+/, "")}`;
};

/** One request, no retries and no redirects. */
const sendOnce = (url: string, options: HttpRequestOptions, headers: Record<string, string>): Promise<HttpResponse> =>
  new Promise((resolve, reject) => {
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch (err) {
      reject(err);
      return;
    }

    let payload: Buffer | undefined;
    if (options.json !== undefined) {
      payload = Buffer.from(JSON.stringify(options.json), "utf8");
      if (!headers["content-type"]) headers["content-type"] = "application/json";
    } else if (options.body !== undefined) {
      payload = Buffer.isBuffer(options.body) ? options.body : Buffer.from(options.body, "utf8");
    }
    if (payload !== undefined) headers["content-length"] = String(payload.length);
    if (!headers["accept-encoding"]) headers["accept-encoding"] = "gzip, deflate, br";

    const requestOptions: RequestOptions = {
      method: (options.method ?? "GET").toUpperCase(),
      headers,
    };
    const send = parsed.protocol === "http:" ? httpRequest : httpsRequest;
    const req = send(parsed, requestOptions, (res: IncomingMessage) => {
      const chunks: Buffer[] = [];
      res.on("data", (chunk: Buffer) => chunks.push(chunk));
      res.on("end", () => {
        const raw = decompress(Buffer.concat(chunks), res.headers["content-encoding"]);
        let body: unknown;
        try {
          body = parseBody(raw, options.responseType ?? "json");
        } catch (err) {
          reject(err);
          return;
        }
        resolve({
          statusCode: res.statusCode ?? 0,
          statusMessage: res.statusMessage ?? "",
          headers: res.headers,
          body,
          requestUrl: url,
        });
      });
      res.on("error", reject);
    });

    if (options.timeoutMs !== undefined) {
      req.setTimeout(options.timeoutMs, () => req.destroy(new Error(`Timed out after ${options.timeoutMs} ms`)));
    }
    req.on("error", reject);
    if (payload !== undefined) req.write(payload);
    req.end();
  });

export interface HttpClientOptions extends HttpRequestOptions {
  /** Awaited before every attempt — this library uses it to rate limit. */
  beforeRequest?: () => Promise<void> | void;
  /**
   * Runs after a response is received. It may return a different response, typically by calling
   * `retry` with extra options (this library re-authenticates on 401 and replays the request).
   */
  afterResponse?: (
    response: HttpResponse,
    retry: (extra?: HttpRequestOptions) => Promise<HttpResponse>
  ) => Promise<HttpResponse>;
}

export class HttpClient {
  private defaults: HttpClientOptions;

  constructor(defaults: HttpClientOptions = {}) {
    this.defaults = { ...defaults, headers: { ...defaults.headers } };
  }

  /** Replaces the default headers wholesale. */
  public setHeaders(headers: Record<string, string | undefined>): void {
    this.defaults.headers = { ...headers };
  }

  /** Merges into the default headers; an undefined value removes one. */
  public mergeHeaders(headers: Record<string, string | undefined>): void {
    this.defaults.headers = { ...this.defaults.headers, ...headers };
  }

  public getPrefixUrl(): string {
    return this.defaults.prefixUrl ?? "";
  }

  public async request<T = any>(endpoint: string, options: HttpRequestOptions = {}): Promise<HttpResponse<T>> {
    return this.send(endpoint, options, true) as Promise<HttpResponse<T>>;
  }

  private async send(endpoint: string, options: HttpRequestOptions, runAfterResponse: boolean): Promise<HttpResponse> {
    const merged: HttpRequestOptions = { ...this.defaults, ...options };
    const prefixUrl = options.prefixUrl !== undefined ? options.prefixUrl : this.defaults.prefixUrl;
    const retry = { ...DEFAULT_RETRY, ...this.defaults.retry, ...options.retry };
    const method = (merged.method ?? "GET").toUpperCase();
    const retryable = retry.methods.map((m) => m.toUpperCase()).includes(method);

    let lastError: unknown;
    for (let attempt = 0; attempt <= (retryable ? retry.limit : 0); attempt++) {
      if (attempt > 0) {
        await sleep(2 ** (attempt - 1) * 1000 * retry.delayMultiplier);
      }
      if (this.defaults.beforeRequest) await this.defaults.beforeRequest();

      let response: HttpResponse;
      try {
        response = await this.follow(resolveUrl(endpoint, prefixUrl), merged, options);
      } catch (err) {
        lastError = err;
        continue;
      }

      if (retryable && attempt < retry.limit && retry.statusCodes.includes(response.statusCode)) {
        lastError = new HttpError(response);
        continue;
      }

      if (runAfterResponse && this.defaults.afterResponse) {
        response = await this.defaults.afterResponse(response, (extra) =>
          // The replay is a fresh request that must not re-enter afterResponse, otherwise a server
          // that keeps answering 401 would recurse until the stack gives out.
          this.send(endpoint, { ...options, ...extra, headers: { ...options.headers, ...extra?.headers } }, false)
        );
      }

      if (merged.throwHttpErrors !== false && (response.statusCode < 200 || response.statusCode >= 400)) {
        throw new HttpError(response);
      }
      return response;
    }
    throw lastError instanceof Error ? lastError : new Error(String(lastError));
  }

  private async follow(url: string, merged: HttpRequestOptions, options: HttpRequestOptions): Promise<HttpResponse> {
    let current = url;
    let body = merged.body;
    let json = merged.json;
    let method = merged.method ?? "GET";
    for (let redirect = 0; ; redirect++) {
      const headers = normalizeHeaders(this.defaults.headers, options.headers);
      const response = await sendOnce(current, { ...merged, method, body, json }, headers);
      const location = response.headers.location;
      if (!REDIRECT_CODES.has(response.statusCode) || !location || redirect >= MAX_REDIRECTS) return response;
      current = new URL(location, current).toString();
      if (
        response.statusCode === 303 ||
        ((response.statusCode === 301 || response.statusCode === 302) && method !== "GET" && method !== "HEAD")
      ) {
        method = "GET";
        body = undefined;
        json = undefined;
      }
    }
  }
}
