import { LRUCache } from 'lru-cache';

import type {
  AnyWidgetParams,
  BaseWidgetParams,
  CalendarParams,
  RedditParams,
  RssParams,
  TabbedParams,
  ServicesParams,
  CustomApiParams,
} from '$lib/types/widget.params';
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
  cachedAt?: number;
}

interface WidgetHandlers {
  [type: string]: (params: AnyWidgetParams) => Promise<AnyWidgetData>;
}

const DEFAULT_CACHE_TTL = 2 * 60 * 60 * 1000;

const widgetCache = new LRUCache<string, Widget>({
  max: 500,
});

const widgetHandlers: WidgetHandlers = {};

export function registerWidget(
  type: string,
  handler: (params: AnyWidgetParams) => Promise<AnyWidgetData>,
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

export function createTabbedWidget(id: string, widgets: BaseWidgetParams[]): Widget {
  const nestedIds: string[] = [];
  for (let i = 0; i < widgets.length; i++) {
    const widget = widgets[i];
    const nestedParams = widget;
    const nestedId = `${id}:tab:${i}`;
    const nested = createWidget(nestedId, widget.type, nestedParams);
    nestedIds.push(nested.id);
  }
  const tabbed = createWidget(id, 'tabbed', { type: 'tabbed', id, widgets });
  tabbed.data = { ids: nestedIds, widgets };
  return tabbed;
}

export function getOrCreateWidget(id: string, widget: AnyWidgetParams): string {
  const existing = getWidget(id);
  if (existing) return existing.id;

  const created =
    widget.type === 'tabbed'
      ? createTabbedWidget(id, widget.widgets)
      : createWidget(id, widget.type, widget);
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
    return { data: widget.data, params: widget.params };
  }

  try {
    const data = await handler(widget.params);
    widget.data = data;
    widget.cachedAt = Date.now();
    setWidget(id, widget);
    return { data, params: widget.params };
  } catch (error) {
    if (widget.data) {
      return { data: widget.data, params: widget.params };
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
  return fetchRSS(params.feeds, params.limit);
});

registerWidget('calendar', async (params) => {
  params = params as CalendarParams;
  const { fetchCalendar } = await import('./api/calendar');
  return fetchCalendar(params.icals, params.limit);
});

registerWidget('reddit', async (params) => {
  params = params as RedditParams;
  const { fetchRedditPosts } = await import('./api/reddit');
  return fetchRedditPosts(params.subreddit, params.sort, params.limit, params.time);
});

registerWidget('tabbed', async (params) => {
  params = params as TabbedParams;
  const widget = widgetCache.get(params.id);
  return widget?.data ?? [];
});

registerWidget('services', async (params) => {
  params = params as ServicesParams;
  const { fetchContainerData, getContainerHost } = await import('./api/container');
  const { checkEndpoint } = await import('./api/endpoint');

  const results: (ContainerData | EndpointData)[] = [];

  for (const service of params.services) {
    if (service.type === 'container') {
      const host = getContainerHost(service);
      const data = await fetchContainerData(host, service.id);
      results.push(data);
    } else if (service.type === 'endpoint') {
      const data = await checkEndpoint(service.name, service.statusCheckUrl);
      results.push(data);
    }
  }

  return results;
});

registerWidget('custom-api', async (params) => {
  params = params as CustomApiParams;
  const { renderCustomTemplate } = await import('./api/custom-api');
  return renderCustomTemplate(params);
});
