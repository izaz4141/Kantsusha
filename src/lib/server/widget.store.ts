import { LRUCache } from 'lru-cache';
import type { AnyWidget } from './config/widget';
import { timeToMs } from '$lib/utils/time';

export interface Widget {
  id: string;
  type: string;
  params: Record<string, any>;
  data?: any;
  cachedAt?: number;
}

interface WidgetHandlers {
  [type: string]: (params: Record<string, any>) => Promise<any>;
}

const DEFAULT_CACHE_TTL = 2 * 60 * 60 * 1000;

const widgetCache = new LRUCache<string, Widget>({
  max: 500,
});

const widgetHandlers: WidgetHandlers = {};

export function registerWidget(
  type: string,
  handler: (params: Record<string, any>) => Promise<any>,
) {
  widgetHandlers[type] = handler;
}

export function getWidget(id: string): Widget | undefined {
  return widgetCache.get(id);
}

export function setWidget(id: string, widget: Widget) {
  widgetCache.set(id, widget);
}

export function createWidget(id: string, type: string, params: Record<string, any>): Widget {
  const widget: Widget = { id, type, params };
  setWidget(id, widget);
  return widget;
}

export function createTabbedWidget(id: string, widgets: AnyWidget[]): Widget {
  const nestedIds: string[] = [];
  for (let i = 0; i < widgets.length; i++) {
    const widget = widgets[i];
    const nestedParams = widgetParams(widget);
    const nestedId = `${id}:tab:${i}`;
    const nested = createWidget(nestedId, widget.type, nestedParams);
    nestedIds.push(nested.id);
  }
  const tabbed = createWidget(id, 'tabbed', { id, widgets });
  tabbed.data = { ids: nestedIds };
  return tabbed;
}

export function getOrCreateWidget(id: string, widget: AnyWidget): string {
  const existing = getWidget(id);
  if (existing) return existing.id;

  const created =
    widget.type === 'tabbed'
      ? createTabbedWidget(id, widget.widgets)
      : createWidget(id, widget.type, widgetParams(widget));
  return created.id;
}

export function widgetParams(widget: AnyWidget): Record<string, any> {
  switch (widget.type) {
    case 'calendar':
      return {
        title: widget.title,
        icals: widget.icals,
        cache: widget.cache,
        update: widget.update,
      };
    case 'rss':
      return {
        title: widget.title,
        feeds: widget.feeds,
        showThumbnail: widget.showThumbnail,
        collapseAfter: widget.collapseAfter,
        cache: widget.cache,
        update: widget.update,
      };
    case 'reddit':
      return {
        title: widget.title,
        subreddit: widget.subreddit,
        sort: widget.sort,
        time: widget.time,
        limit: widget.limit,
        showThumbnail: widget.showThumbnail,
        collapseAfter: widget.collapseAfter,
        cache: widget.cache,
        update: widget.update,
      };
    default:
      return {};
  }
}

export interface WidgetData {
  data: any;
  params: Record<string, any>;
}

export async function fetchWidgetData(id: string): Promise<WidgetData> {
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
  const { fetchRSS } = await import('./api/rss');
  return fetchRSS(params.feeds, params.limit);
});

registerWidget('calendar', async (params) => {
  const { fetchCalendar } = await import('./api/calendar');
  return fetchCalendar(params.icals, params.limit);
});

registerWidget('reddit', async (params) => {
  const { fetchRedditPosts } = await import('./api/reddit');
  return fetchRedditPosts(params.subreddit, params.sort, params.limit, params.time);
});

registerWidget('tabbed', async (params) => {
  const widget = widgetCache.get(params.id);
  return widget?.data ?? {};
});
