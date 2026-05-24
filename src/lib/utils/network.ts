export async function fetchURL(
  url: string,
  options: {
    customHeaders?: Record<string, string>;
    returnText?: boolean;
    userAgent?: string;
    method?: string;
    skipBody?: boolean;
    body?: string;
  } = { method: 'GET' },
): Promise<string | unknown> {
  const maxRetries = 5;
  const timeoutMs = 15000;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    try {
      const headers: Record<string, string> = {
        'User-Agent':
          options.userAgent ||
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
        ...options.customHeaders,
      };

      const response = await Promise.race([
        fetch(url, {
          method: options.method,
          headers,
          body: options.body,
        }),
        new Promise<Response>((_, reject) => {
          timeoutId = setTimeout(
            () => reject(new Error(`Request to ${url} timed out after ${timeoutMs}ms`)),
            timeoutMs,
          );
        }),
      ]);

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorMessage = `Failed to fetch ${url}: ${response.status}`;
        try {
          const errorBody = await response.json();
          if (errorBody.error) {
            errorMessage = errorBody.error;
          }
        } catch {
          // Ignore JSON parse errors, use generic message
        }
        throw new Error(errorMessage);
      }

      if (options?.skipBody) {
        return response;
      }

      if (options?.returnText === false) {
        return response.json();
      }

      return response.text();
    } catch (err) {
      clearTimeout(timeoutId);

      if (attempt === maxRetries - 1) {
        throw err;
      }

      const delay = Math.pow(2, attempt) * 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw new Error(`Failed to fetch ${url} after ${maxRetries} attempts`);
}
