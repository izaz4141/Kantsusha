class ConcurrencyLimiter {
  private active = 0;
  private queue: Array<() => void> = [];

  constructor(private limit: number) {}

  async acquire(): Promise<void> {
    if (this.active < this.limit) {
      this.active++;
      return;
    }
    return new Promise<void>((resolve) => {
      this.queue.push(resolve);
    });
  }

  release(): void {
    const next = this.queue.shift();
    if (next) {
      next();
    } else {
      this.active--;
    }
  }
}

const requestLimiter = new ConcurrencyLimiter(15);

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
    await requestLimiter.acquire();

    const controller = new AbortController();
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    try {
      const headers: Record<string, string> = {
        'User-Agent':
          options.userAgent ||
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
        ...options.customHeaders,
      };

      timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(url, {
        method: options.method,
        headers,
        body: options.body,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorMessage = `Failed to fetch ${url}: ${response.status}`;
        try {
          const errorBody = await response.json();
          if (errorBody.error) {
            errorMessage = errorBody.error;
          }
        } catch {
          await response.body?.cancel();
        }
        throw new Error(errorMessage);
      }

      if (options?.skipBody) {
        response.body?.cancel();
        return response;
      }

      if (options?.returnText === false) {
        return response.json();
      }

      return response.text();
    } catch (err) {
      clearTimeout(timeoutId);

      if (attempt === maxRetries - 1) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          throw new Error(`Request timed out after ${timeoutMs}ms: ${url}`, { cause: err });
        }
        throw err;
      }

      const delay = Math.pow(2, attempt) * 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));
    } finally {
      requestLimiter.release();
    }
  }

  throw new Error(`Failed to fetch ${url} after ${maxRetries} attempts`);
}
