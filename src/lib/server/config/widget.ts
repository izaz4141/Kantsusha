import type { WidgetType } from '$lib/types/widget.interfaces';
import { WIDGET_SCHEMA } from '$lib/types/widget.schema';
import type {
  AnyWidget,
  CalendarWidget,
  RSSWidget,
  RedditWidget,
  TabbedWidget,
} from '$lib/types/widget.interfaces';
import { timeToMs } from '$lib/utils/time';

export type { WidgetType, AnyWidget, CalendarWidget, RSSWidget, RedditWidget, TabbedWidget };

const VALID_SORTS = ['top', 'hot', 'new', 'controversial'];
const VALID_TIMES = ['hour', 'day', 'week', 'month', 'year', 'all'];

function validateCalendarWidget(raw: Record<string, unknown>): CalendarWidget | null {
  const icalsRaw = raw.icals;
  if (!icalsRaw || !Array.isArray(icalsRaw)) {
    console.warn('Warning: Calendar widget missing "icals" array, skipping');
    return null;
  }

  const icals: { url: string; limit: number }[] = [];
  for (const ical of icalsRaw) {
    if (!ical || typeof ical !== 'object') continue;
    const i = ical as Record<string, unknown>;
    if (typeof i.url !== 'string') continue;
    icals.push({
      url: i.url,
      limit: typeof i.limit === 'number' ? i.limit : 50,
    });
  }

  if (icals.length === 0) {
    console.warn('Warning: Calendar widget has no valid icals, skipping');
    return null;
  }

  const title = typeof raw.title === 'string' ? raw.title : undefined;
  const cache = typeof raw.cache === 'string' ? raw.cache : undefined;
  const update = typeof raw.update === 'string' && timeToMs(raw.update) ? raw.update : undefined;
  const limit = typeof raw.limit === 'number' ? raw.limit : 50;

  return {
    type: 'calendar',
    title,
    cache,
    update,
    icals,
    limit,
  };
}

function validateRSSWidget(raw: Record<string, unknown>): RSSWidget | null {
  const feedsRaw = raw.feeds;
  if (!feedsRaw || !Array.isArray(feedsRaw)) {
    console.warn('Warning: RSS widget missing "feeds" array, skipping');
    return null;
  }

  const feeds: { url: string }[] = [];
  for (const feed of feedsRaw) {
    if (!feed || typeof feed !== 'object') continue;
    const f = feed as Record<string, unknown>;
    if (typeof f.url === 'string') {
      feeds.push({ url: f.url });
    }
  }

  if (feeds.length === 0) {
    console.warn('Warning: RSS widget has no valid feeds, skipping');
    return null;
  }

  const title = typeof raw.title === 'string' ? raw.title : 'RSS Feed';
  const showThumbnail = typeof raw.showThumbnail === 'boolean' ? raw.showThumbnail : false;
  const collapseAfter = typeof raw.collapseAfter === 'number' ? raw.collapseAfter : 5;
  const cache = typeof raw.cache === 'string' ? raw.cache : undefined;
  const update = typeof raw.update === 'string' && timeToMs(raw.update) ? raw.update : undefined;

  return {
    type: 'rss',
    title,
    feeds,
    showThumbnail,
    collapseAfter,
    cache,
    update,
  };
}

function validateRedditWidget(raw: Record<string, unknown>): RedditWidget | null {
  const subreddit = raw.subreddit;
  if (typeof subreddit !== 'string') {
    console.warn('Warning: Reddit widget missing "subreddit", skipping');
    return null;
  }

  const sort =
    raw.sort && VALID_SORTS.includes(raw.sort as string)
      ? (raw.sort as 'top' | 'hot' | 'new' | 'controversial')
      : 'top';

  const time =
    raw.time && VALID_TIMES.includes(raw.time as string)
      ? (raw.time as 'hour' | 'day' | 'week' | 'month' | 'year' | 'all')
      : 'month';

  const limit = typeof raw.limit === 'number' ? raw.limit : 10;

  const title = typeof raw.title === 'string' ? raw.title : `r/${subreddit}`;
  const showThumbnail = typeof raw.showThumbnail === 'boolean' ? raw.showThumbnail : false;
  const collapseAfter = typeof raw.collapseAfter === 'number' ? raw.collapseAfter : 5;
  const cache = typeof raw.cache === 'string' ? raw.cache : undefined;
  const update = typeof raw.update === 'string' && timeToMs(raw.update) ? raw.update : undefined;

  return {
    type: 'reddit',
    title,
    subreddit,
    sort,
    time,
    limit,
    showThumbnail,
    collapseAfter,
    cache,
    update,
  };
}

function validateTabbedWidget(raw: Record<string, unknown>): TabbedWidget | null {
  const widgetsRaw = raw.widgets;
  if (!widgetsRaw || !Array.isArray(widgetsRaw)) {
    console.warn('Warning: Tabbed widget missing "widgets" array, skipping');
    return null;
  }

  const widgets: AnyWidget[] = [];
  for (const rawWidget of widgetsRaw) {
    if (!rawWidget || typeof rawWidget !== 'object') continue;
    const w = rawWidget as Record<string, unknown>;
    const wType = w.type;
    if (typeof wType !== 'string' || wType === 'tabbed') continue;
    const validated = validateWidget(rawWidget);
    if (validated) widgets.push(validated);
  }

  if (widgets.length === 0) {
    console.warn('Warning: Tabbed widget has no valid widgets, skipping');
    return null;
  }

  return {
    type: 'tabbed',
    widgets,
  };
}

export function validateWidget(raw: unknown): AnyWidget | null {
  if (!raw || typeof raw !== 'object') {
    console.warn('Warning: Invalid widget, skipping');
    return null;
  }

  const r = raw as Record<string, unknown>;
  const type = r.type;

  if (typeof type !== 'string') {
    console.warn('Warning: Widget missing "type", skipping');
    return null;
  }

  const widgetType = type as WidgetType;
  const schema = WIDGET_SCHEMA[widgetType];

  if (!schema) {
    console.warn(`Warning: Unknown widget type "${type}", skipping`);
    return null;
  }

  for (const req of schema.required) {
    if (!(req in r)) {
      console.warn(`Warning: Widget type "${type}" missing required field "${req}", skipping`);
      return null;
    }
  }

  switch (widgetType) {
    case 'calendar':
      return validateCalendarWidget(r);
    case 'rss':
      return validateRSSWidget(r);
    case 'reddit':
      return validateRedditWidget(r);
    case 'tabbed':
      return validateTabbedWidget(r);
    default:
      return null;
  }
}

export function parseWidgets(rawWidgets: unknown): AnyWidget[] {
  if (!Array.isArray(rawWidgets)) {
    console.warn('Warning: Widgets is not an array, skipping');
    return [];
  }

  const widgets: AnyWidget[] = [];
  for (const raw of rawWidgets) {
    const widget = validateWidget(raw);
    if (widget) {
      widgets.push(widget);
    }
  }

  return widgets;
}
