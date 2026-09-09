const fetchImpl: typeof globalThis.fetch = globalThis.fetch;

/**
 * Optional TLS fingerprint (JA3/JA4 impersonation) passed through to Bun's
 * native `fetch(url, { tls })`. Only supported when running under Bun >= 1.4.1;
 * it is ignored on other runtimes.
 */
export interface BunTlsFingerprint {
  ja3?: string;
  grease?: boolean;
  permuteExtensions?: boolean;
  certificateCompression?: string[];
}

interface FetchURLOptions {
  customHeaders?: Record<string, string>;
  returnText?: boolean;
  userAgent?: string;
  method?: string;
  skipBody?: boolean;
  body?: string;
  retry?: number;
  captureResponse?: (response: Response) => void;
  tls?: BunTlsFingerprint;
}

/**
 * True when the current runtime supports Bun's native `fetch` TLS fingerprint
 * options (`tls.ja3`, `grease`, `permuteExtensions`, ...). These landed in
 * Bun 1.4.1, so versions below that (or non-Bun runtimes) are not supported.
 */
export function supportsBunTlsFingerprint(): boolean {
  if (typeof Bun === 'undefined' || typeof Bun.version !== 'string') return false;
  const parts = Bun.version.split('.').map((n) => parseInt(n, 10) || 0);
  if (parts[0] > 1) return true;
  if (parts[0] < 1) return false;
  return parts[1] >= 4;
}

/* eslint-disable preserve-caught-error */
export async function fetchURL(
  url: string,
  options: FetchURLOptions = { method: 'GET', retry: 4 },
): Promise<string | unknown> {
  const maxRetries = (options.retry ?? 4) + 1;
  const timeoutMs = 15000;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const headers: Record<string, string> = {
        'User-Agent':
          options.userAgent ||
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
        ...options.customHeaders,
      };

      const init: RequestInit & Record<string, unknown> = {
        method: options.method,
        headers,
        body: options.body,
        signal: AbortSignal.timeout(timeoutMs),
        keepalive: false,
      };

      // Bun-specific TLS fingerprint (only applies under Bun >= 1.4.1).
      if (options.tls && supportsBunTlsFingerprint()) {
        init.tls = options.tls;
      }

      const response = await fetchImpl(url, init as RequestInit);

      options.captureResponse?.(response);

      if (!response.ok) {
        await response.body?.cancel().catch(() => {});
        throw new Error(`Failed to fetchURL ${url}: ${response.status}`);
      }

      if (options?.skipBody) {
        await response.body?.cancel().catch(() => {});
        return response;
      }

      if (options?.returnText === false) {
        return response.json();
      }

      return response.text();
    } catch (err) {
      if (attempt === maxRetries - 1) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          throw new Error(`Request timed out after ${timeoutMs}ms: ${url}`);
        }
        throw err;
      }

      const delay = Math.pow(2, attempt) * 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw new Error(`Failed to fetch ${url} after ${maxRetries} attempts`);
}

export class ReaderStream {
  private reader: ReadableStreamDefaultReader<Uint8Array>;
  private decoder = new TextDecoder();

  constructor(reader: ReadableStreamDefaultReader<Uint8Array>) {
    this.reader = reader;
  }

  async readChunk(): Promise<{ done: boolean; value: string }> {
    const result = await this.reader.read();
    if (result.done) {
      const remaining = this.decoder.decode();
      return { done: true, value: remaining };
    }
    return { done: false, value: this.decoder.decode(result.value, { stream: true }) };
  }

  async cancel(): Promise<void> {
    await this.reader.cancel().catch(() => {});
  }
}

export async function fetchURLStream(
  url: string,
  options: {
    customHeaders?: Record<string, string>;
    userAgent?: string;
    method?: string;
    body?: string;
    retry?: number;
    tls?: BunTlsFingerprint;
  } = { method: 'GET', retry: 0 },
): Promise<ReaderStream> {
  const maxRetries = (options.retry ?? 0) + 1;
  const timeoutMs = 15000;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const headers: Record<string, string> = {
        'User-Agent':
          options.userAgent ||
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
        ...options.customHeaders,
      };

      const init: RequestInit & Record<string, unknown> = {
        method: options.method,
        headers,
        body: options.body,
        signal: AbortSignal.timeout(timeoutMs),
        keepalive: false,
      };

      // Bun-specific TLS fingerprint (only applies under Bun >= 1.4.1).
      if (options.tls && supportsBunTlsFingerprint()) {
        init.tls = options.tls;
      }

      const response = await fetchImpl(url, init as RequestInit);

      if (!response.ok) {
        await response.body?.cancel().catch(() => {});
        throw new Error(`Failed to fetchStream ${url}: ${response.status}`);
      }

      if (!response.body) {
        throw new Error(`No response body for ${url}`);
      }

      return new ReaderStream(response.body.getReader() as ReadableStreamDefaultReader<Uint8Array>);
    } catch (err) {
      if (attempt === maxRetries - 1) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          throw new Error(`Request timed out after ${timeoutMs}ms: ${url}`);
        }
        throw err;
      }

      const delay = Math.pow(2, attempt) * 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw new Error(`Failed to fetch ${url} after ${maxRetries} attempts`);
}
