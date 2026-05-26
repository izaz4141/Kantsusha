import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSearchConfig } from '$lib/server/config/config';
import { fetchURL } from '$lib/utils/network';

export const GET: RequestHandler = async ({ url }) => {
  const q = url.searchParams.get('q');
  const engine = url.searchParams.get('engine');

  if (!q) {
    return json({ suggestions: [] });
  }

  const config = await getSearchConfig();
  if (!config.enabled) {
    return json({ error: 'Search is disabled' }, { status: 503 });
  }

  const engineKey = engine || config.default || Object.keys(config.engines)[0];
  const engineConfig = config.engines[engineKey];
  if (!engineConfig?.autoCompleteUrl) {
    return json({ suggestions: [] });
  }

  const targetUrl = engineConfig.autoCompleteUrl.replace('${QUERY}', encodeURIComponent(q));

  try {
    const data = await fetchURL(targetUrl, {
      retry: 0,
      returnText: false,
      customHeaders: {
        Accept: 'application/json',
      },
    });

    let suggestions: string[] = [];

    if (Array.isArray(data)) {
      if (data.length > 0 && typeof data[0] === 'string') {
        suggestions = (data[1] as unknown[]).filter((s): s is string => typeof s === 'string');
      } else {
        suggestions = data
          .map((item: unknown) => {
            if (typeof item === 'string') return item;
            if (item && typeof item === 'object' && 'phrase' in (item as Record<string, unknown>)) {
              return (item as Record<string, unknown>).phrase as string;
            }
            return null;
          })
          .filter((s): s is string => s !== null);
      }
    } else if (data && typeof data === 'object') {
      const obj = data as Record<string, unknown>;
      if (Array.isArray(obj.suggestions)) {
        suggestions = obj.suggestions.filter((s: unknown): s is string => typeof s === 'string');
      }
    }

    return json({ suggestions: suggestions.slice(0, 8) });
  } catch (err) {
    console.error('Search autocomplete error:', err);
    return json({ suggestions: [] });
  }
};
