export type WidgetType = 'calendar' | 'rss' | 'reddit' | 'tabbed';

export type AnyWidget = CalendarWidget | RSSWidget | RedditWidget | TabbedWidget;

export interface CalendarWidget {
  type: 'calendar';
  title?: string;
  cache?: string;
  update?: string;
  icals: ICalFeed[];
  limit?: number;
}

export interface ICalFeed {
  url: string;
  color?: string;
  headers?: Record<string, string>;
}

export interface RSSWidget {
  type: 'rss';
  title?: string;
  cache?: string;
  update?: string;
  feeds: { url: string }[];
  showThumbnail?: boolean;
  collapseAfter?: number;
}

export interface RedditWidget {
  type: 'reddit';
  title?: string;
  cache?: string;
  update?: string;
  subreddit: string;
  sort?: 'top' | 'hot' | 'new' | 'controversial';
  time?: 'hour' | 'day' | 'week' | 'month' | 'year' | 'all';
  limit?: number;
  showThumbnail?: boolean;
  collapseAfter?: number;
}

export interface TabbedWidget {
  type: 'tabbed';
  title?: string;
  widgets: AnyWidget[];
}
