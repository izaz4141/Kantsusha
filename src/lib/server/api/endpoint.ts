import type { EndpointData } from '$lib/types/widget.data';
import { fetchURL } from '$lib/utils/network';

export async function checkEndpoint(
  name: string,
  statusCheckUrl: string | undefined,
): Promise<EndpointData> {
  if (!statusCheckUrl) {
    return { name, status: 'unknown' };
  }

  const startTime = Date.now();
  try {
    const response = (await fetchURL(statusCheckUrl, {
      method: 'GET',
      skipBody: true,
    })) as Response;
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
