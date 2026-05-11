import type { EndpointData } from '$lib/types/widget.data';

export async function checkEndpoint(
  name: string,
  statusCheckUrl: string | undefined,
): Promise<EndpointData> {
  if (!statusCheckUrl) {
    return { name, status: 'unknown' };
  }

  const startTime = Date.now();
  try {
    const response = await fetch(statusCheckUrl, {
      method: 'HEAD',
      signal: AbortSignal.timeout(5000),
    });
    return {
      name,
      status: response.ok ? 'online' : 'offline',
      statusCode: response.status,
      responseTime: Date.now() - startTime,
    };
  } catch {
    return {
      name,
      status: 'offline',
      responseTime: Date.now() - startTime,
    };
  }
}
