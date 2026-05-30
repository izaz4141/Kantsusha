import { fetch } from 'undici';

/* eslint-disable preserve-caught-error */
export async function fetchURL(
  url: string,
  options: {
    customHeaders?: Record<string, string>;
    returnText?: boolean;
    userAgent?: string;
    method?: string;
    skipBody?: boolean;
    body?: string;
    retry?: number;
  } = { method: 'GET', retry: 4 },
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

      const response = await fetch(url, {
        method: options.method,
        headers,
        body: options.body,
        signal: AbortSignal.timeout(timeoutMs),
      });

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

      const response = await fetch(url, {
        method: options.method,
        headers,
        body: options.body,
        signal: AbortSignal.timeout(timeoutMs),
      });

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
