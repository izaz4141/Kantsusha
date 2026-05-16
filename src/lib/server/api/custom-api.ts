import type { CustomApiParams } from '$lib/types/widget.params';
import type { CustomApiData } from '$lib/types/widget.data';
import { fetchURL } from '$lib/utils/network';
import { SAFE_GLOBALS, parseTemplate } from '$lib/utils/extension';

interface FetchContext {
  [fetchId: string]: unknown;
}

function interpolateUrl(
  url: string,
  context: FetchContext,
  options?: Record<string, unknown>,
): string {
  const evalContext = {
    fetched: context,
    ...SAFE_GLOBALS,
    options: options ?? {},
  };

  const pattern = /\$\{([^}]+)\}/g;
  return url.replace(pattern, (_match, expr) => {
    try {
      const func = new Function(...Object.keys(evalContext), `"use strict"; return (${expr});`);
      const result = func(...Object.values(evalContext));
      if (result === undefined || result === null)
        throw new Error(`Expression evaluated to undefined/null: ${expr}`);
      return String(result);
    } catch (err) {
      throw new Error(
        `Failed to interpolate URL expression "${expr}": ${err instanceof Error ? err.message : String(err)}`,
        { cause: err },
      );
    }
  });
}

export async function fetchChain(
  fetches?: Record<
    string,
    {
      method?: 'get' | 'post';
      url: string;
      type?: 'text' | 'json';
      headers?: Record<string, string>;
      body?: string;
    }
  >,
  options?: Record<string, unknown>,
): Promise<FetchContext> {
  if (!fetches) return {};

  const context: FetchContext = {};

  for (const [id, request] of Object.entries(fetches ?? {})) {
    const url = interpolateUrl(request.url, context, options);

    let data: unknown;
    if (request.type === 'text') {
      data = await fetchURL(url, {
        method: request.method,
        customHeaders: request.headers,
        body: request.body,
        returnText: true,
      });
    } else {
      data = await fetchURL(url, {
        method: request.method,
        customHeaders: request.headers,
        body: request.body,
        returnText: false,
      });
    }

    context[id] = data;
  }

  return context;
}

export async function renderCustomTemplate(params: CustomApiParams): Promise<CustomApiData> {
  const context = await fetchChain(params.fetch, params.options);

  const parsed = parseTemplate(params.template);

  return {
    html: parsed.html,
    style: parsed.css,
    script: parsed.script,
    fetched: Object.fromEntries(
      Object.entries(context).map(([id, data]) => [
        id,
        { id, type: typeof data === 'string' ? 'text' : 'json', data },
      ]),
    ),
  };
}
