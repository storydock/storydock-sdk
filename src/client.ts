import { StorydockApiConfigurationError, StorydockApiError } from "./errors.js";
import type { ClientOptions, FetchLike } from "./types.js";

const API_BASE_URL = "https://api.storydock.ai";

interface RequestOptions {
  path: string;
  query?: Record<string, string | number | boolean | null | undefined>;
}

export class HttpClient {
  private readonly apiToken?: string;
  private readonly timeoutMs: number;
  private readonly fetchImpl: FetchLike;
  private readonly userAgent?: string;

  constructor(options: ClientOptions = {}) {
    this.apiToken = options.apiToken?.trim() || undefined;
    this.timeoutMs = options.timeoutMs ?? 8000;
    this.fetchImpl = resolveFetch(options.fetch);
    this.userAgent = options.userAgent?.trim() || undefined;
  }

  async getJson<T>(options: RequestOptions): Promise<T> {
    const url = this.buildUrl(options.path, options.query);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await this.fetchImpl(url, {
        method: "GET",
        headers: this.createHeaders(),
        signal: controller.signal,
      });

      if (!response.ok) {
        const bodyText = await readBodyText(response);
        throw new StorydockApiError(`Request failed: ${response.status} ${response.statusText}`, {
          status: response.status,
          statusText: response.statusText,
          url,
          bodyText,
        });
      }

      return (await response.json()) as T;
    } catch (error) {
      if (isAbortError(error)) {
        throw new Error(`Request timed out after ${this.timeoutMs}ms: ${url}`);
      }

      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private createHeaders(): Headers {
    const headers = new Headers({
      Accept: "application/json",
    });

    if (this.apiToken) {
      headers.set("Authorization", `Bearer ${this.apiToken}`);
    }

    if (this.userAgent) {
      headers.set("X-Storydock-Client", this.userAgent);
    }

    return headers;
  }

  private buildUrl(path: string, query?: Record<string, string | number | boolean | null | undefined>): string {
    const url = new URL(path.replace(/^\/+/, ""), `${API_BASE_URL}/`);

    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value === undefined || value === null || value === "") {
          continue;
        }

        url.searchParams.set(key, String(value));
      }
    }

    return url.toString();
  }
}

function resolveFetch(fetchImpl?: FetchLike): FetchLike {
  if (fetchImpl) {
    return fetchImpl;
  }

  if (typeof fetch !== "function") {
    throw new StorydockApiConfigurationError(
      "No fetch implementation found. Provide options.fetch when running in an environment without global fetch."
    );
  }

  return fetch.bind(globalThis);
}

async function readBodyText(response: Response): Promise<string | null> {
  try {
    const text = await response.text();
    return text || null;
  } catch {
    return null;
  }
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}