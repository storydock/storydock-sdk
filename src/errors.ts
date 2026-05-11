export class StorydockApiError extends Error {
  readonly status: number;
  readonly statusText: string;
  readonly url: string;
  readonly bodyText: string | null;

  constructor(message: string, options: { status: number; statusText: string; url: string; bodyText: string | null }) {
    super(message);
    this.name = "StorydockApiError";
    this.status = options.status;
    this.statusText = options.statusText;
    this.url = options.url;
    this.bodyText = options.bodyText;
  }
}

export class StorydockApiConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StorydockApiConfigurationError";
  }
}