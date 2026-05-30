import { LRUCache } from 'lru-cache';
import logger from '$lib/server/logger';

import type {
  AnyWidgetParams,
  CalendarParams,
  RedditParams,
  RssParams,
  YouTubeParams,
  TabbedParams,
  SplitColumnParams,
  SplitRowParams,
  ServicesParams,
  CustomApiParams,
  TwitchChannelParams,
  MarketsParams,
  WrapperWidgetParams,
  WrapperWidgetEntry,
} from '$lib/types/widget.params';
import { WrapperWidgetParamsSchema } from '$lib/types/widget.params';
import type {
  AnyWidgetData,
  AnyWidgetInfo,
  ContainerData,
  EndpointData,
} from '$lib/types/widget.data';
import { timeToMs } from '$lib/utils/time';

export interface Widget {
  id: string;
  type: string;
  params: AnyWidgetParams;
  data?: AnyWidgetData;
  errors?: string[];
  cachedAt?: number;
}

interface WidgetHandlerResult {
  data: AnyWidgetData;
  errors: string[];
}

interface WidgetHandlers {
  [type: string]: (params: AnyWidgetParams) => Promise<WidgetHandlerResult>;
}

const DEFAULT_CACHE_TTL = 2 * 60 * 60 * 1000;

const widgetCache = new LRUCache<string, Widget>({
  max: 500,
});

const widgetHandlers: WidgetHandlers = {};

export function registerWidget(
  type: string,
  handler: (params: AnyWidgetParams) => Promise<WidgetHandlerResult>,
) {
  widgetHandlers[type] = handler;
}

export function getWidget(id: string): Widget | undefined {
  return widgetCache.get(id);
}

export function setWidget(id: string, widget: Widget) {
  widgetCache.set(id, widget);
}

export function createWidget(id: string, type: string, params: AnyWidgetParams): Widget {
  const widget: Widget = { id, type, params };
  setWidget(id, widget);
  return widget;
}

export function createWrapperWidget(
  id: string,
  type: WrapperWidgetParams['type'],
  params: WrapperWidgetParams,
): Widget {
  const nestedIds: string[] = [];
  const widgets = params.widgets as WrapperWidgetEntry[];
  for (let i = 0; i < widgets.length; i++) {
    const widget = widgets[i] as AnyWidgetParams;
    const nestedId = `${id}:wrapper:${i}`;
    const isWrapper = WrapperWidgetParamsSchema.options.some(
      (o) => o.shape.type.value == widget.type,
    );
    const nested = isWrapper
      ? createWrapperWidget(
          nestedId,
          widget.type as WrapperWidgetParams['type'],
          widget as WrapperWidgetParams,
        )
      : createWidget(nestedId, widget.type, widget);
    if (isWrapper) {
      (params.widgets as WrapperWidgetParams[])[i].id = nestedId;
    }
    nestedIds.push(nested.id);
  }
  const wrapper = createWidget(id, type, { ...params, id: id });
  wrapper.data = { ids: nestedIds };
  return wrapper;
}

export function getOrCreateWidget(id: string, params: AnyWidgetParams): string {
  const existing = getWidget(id);
  if (existing) return existing.id;

  const created = WrapperWidgetParamsSchema.options.some((o) => o.shape.type.value == params.type)
    ? createWrapperWidget(
        id,
        params.type as WrapperWidgetParams['type'],
        params as WrapperWidgetParams,
      )
    : createWidget(id, params.type, params);
  return created.id;
}

export async function fetchWidgetInfo(id: string): Promise<AnyWidgetInfo> {
  const widget = widgetCache.get(id);
  if (!widget) {
    throw new Error('Widget not found');
  }

  const handler = widgetHandlers[widget.type];
  if (!handler) {
    throw new Error(`No handler for widget type: ${widget.type}`);
  }

  const cacheTTL = timeToMs(widget.params.cache) ?? DEFAULT_CACHE_TTL;
  const isExpired = !widget.cachedAt || Date.now() - widget.cachedAt > cacheTTL;

  if (!isExpired && widget.data) {
    return { data: widget.data, params: widget.params, errors: widget.errors ?? [] };
  }

  try {
    const result = await handler(widget.params);

    if (widgetCache.get(id) === widget) {
      widget.data = result.data;
      widget.errors = result.errors;
      widget.cachedAt = Date.now();
      setWidget(id, widget);
    }

    return { data: result.data, params: widget.params, errors: result.errors };
  } catch (error) {
    if (widget.data) {
      return { data: widget.data, params: widget.params, errors: widget.errors ?? [] };
    }
    throw error;
  }
}

export function getAllWidgets(): Widget[] {
  return Array.from(widgetCache.values());
}

export function clearWidgetCache() {
  widgetCache.clear();
}

registerWidget('rss', async (params) => {
  params = params as RssParams;
  const { fetchRSS } = await import('./api/rss');
  const { data, errors } = await fetchRSS(params.feeds, params.limit);
  return { data, errors };
});

registerWidget('calendar', async (params) => {
  params = params as CalendarParams;
  const { fetchCalendar } = await import('./api/calendar');
  const { data, errors } = await fetchCalendar(params.cals, params.range, params.limit);
  return { data, errors };
});

registerWidget('reddit', async (params) => {
  params = params as RedditParams;
  const { fetchRedditPosts } = await import('./api/reddit');
  const { data, errors } = await fetchRedditPosts(
    params.subreddit,
    params.sort,
    params.limit,
    params.time,
  );
  return { data, errors };
});

registerWidget('youtube', async (params) => {
  params = params as YouTubeParams;
  const { fetchYouTube } = await import('./api/youtube');
  const { data, errors } = await fetchYouTube(params.channels, params.limit, params.includeShorts);
  return { data, errors };
});

registerWidget('tabbed', async (params) => {
  params = params as TabbedParams;
  const widget = widgetCache.get(params.id);
  return { data: widget?.data ?? ([] as unknown as AnyWidgetData), errors: [] };
});

registerWidget('split-column', async (params) => {
  params = params as SplitColumnParams;
  const widget = widgetCache.get(params.id);
  return { data: widget?.data ?? ([] as unknown as AnyWidgetData), errors: [] };
});

registerWidget('split-row', async (params) => {
  params = params as SplitRowParams;
  const widget = widgetCache.get(params.id);
  return { data: widget?.data ?? ([] as unknown as AnyWidgetData), errors: [] };
});

registerWidget('services', async (params) => {
  params = params as ServicesParams;
  const { fetchContainerData, getContainerHost } = await import('./api/container');
  const { checkEndpoint } = await import('./api/endpoint');

  const allErrors: string[] = [];
  const results: (ContainerData | EndpointData)[] = [];

  for (const service of params.services) {
    try {
      if (service.type === 'container') {
        const host = getContainerHost(service);
        const { data, errors } = await fetchContainerData(host, service.id);
        results.push(data);
        allErrors.push(...errors);
      } else if (service.type === 'endpoint') {
        const { data, errors } = await checkEndpoint(service.name, service.statusCheckUrl);
        results.push(data);
        allErrors.push(...errors);
      }
    } catch (err) {
      const name = (service as { name?: string }).name ?? 'unknown';
      allErrors.push(`Service ${name} failed unexpectedly`);
      logger.error(err, `Service ${name}`);
    }
  }

  return { data: results, errors: allErrors };
});

registerWidget('custom-api', async (params) => {
  params = params as CustomApiParams;
  const { renderCustomTemplate } = await import('./api/custom-api');
  const { data, errors } = await renderCustomTemplate(params);
  return { data, errors };
});

registerWidget('twitch-channel', async (params) => {
  params = params as TwitchChannelParams;
  const { fetchTwitchChannels } = await import('./api/twitch-channel');
  const { data, errors } = await fetchTwitchChannels(params.channels, params.sort);
  return { data, errors };
});

registerWidget('markets', async (params) => {
  params = params as MarketsParams;
  const { fetchMarketData } = await import('./api/markets');
  const { data, errors } = await fetchMarketData(params.markets);
  return { data, errors };
});
