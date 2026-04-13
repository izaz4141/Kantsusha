import type { WidgetType } from './widget.interfaces';

export type { WidgetType };

export const VALID_SORTS = ['top', 'hot', 'new', 'controversial'] as const;
export const VALID_TIMES = ['hour', 'day', 'week', 'month', 'year', 'all'] as const;

export type ValidSort = (typeof VALID_SORTS)[number];
export type ValidTime = (typeof VALID_TIMES)[number];

export const WIDGET_SCHEMA: Record<WidgetType, { required: string[]; allowed: string[] }> = {
  calendar: {
    required: ['icals'],
    allowed: ['title', 'icals', 'limit', 'cache', 'update'],
  },
  rss: {
    required: ['feeds'],
    allowed: ['title', 'feeds', 'limit', 'showThumbnail', 'collapseAfter', 'cache', 'update'],
  },
  reddit: {
    required: ['subreddit'],
    allowed: [
      'title',
      'subreddit',
      'sort',
      'time',
      'limit',
      'showThumbnail',
      'collapseAfter',
      'cache',
      'update',
    ],
  },
  tabbed: {
    required: ['widgets'],
    allowed: ['widgets'],
  },
};
