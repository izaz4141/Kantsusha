export async function fetchURL(
  url: string,
  options?: {
    customHeaders?: Record<string, string>;
    returnText?: boolean;
    userAgent?: string;
  },
): Promise<string | any> {
  const maxRetries = 5;
  const timeoutMs = 15000;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const headers: Record<string, string> = {
        'User-Agent':
          options?.userAgent ||
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
        ...options?.customHeaders,
      };

      const response = await fetch(url, { headers, signal: controller.signal });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Failed to fetch ${url}: ${response.status}`);
      }

      if (options?.returnText === false) {
        return response.json();
      }

      return response.text();
    } catch (err) {
      clearTimeout(timeoutId);

      const isAbortError =
        err instanceof Error &&
        (err.name === 'AbortError' || (err as any).cause?.name === 'AbortError');

      if (attempt === maxRetries - 1) {
        if (isAbortError) {
          throw new Error(`Request to ${url} timed out after ${timeoutMs}ms`);
        }
        throw err;
      }

      const delay = Math.pow(2, attempt) * 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw new Error(`Failed to fetch ${url} after ${maxRetries} attempts`);
}
