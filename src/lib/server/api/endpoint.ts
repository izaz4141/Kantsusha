import type { EndpointData } from '$lib/types/widget.data';
import { fetchURL } from '$lib/utils/network';

export async function checkEndpoint(
  name: string,
  statusCheckUrl: string | undefined,
): Promise<{ data: EndpointData; errors: string[] }> {
  const errors: string[] = [];
  if (!statusCheckUrl) {
    return { data: { name, status: 'unknown' }, errors };
  }

  const startTime = Date.now();
  try {
    const response = (await fetchURL(statusCheckUrl, {
      method: 'GET',
      skipBody: true,
    })) as Response;
    return {
      data: {
        name,
        status: response.ok ? 'online' : 'offline',
        statusCode: response.status,
        responseTime: Date.now() - startTime,
      },
      errors,
    };
  } catch {
    return {
      data: {
        name,
        status: 'offline',
        responseTime: Date.now() - startTime,
      },
      errors,
    };
  }
}
