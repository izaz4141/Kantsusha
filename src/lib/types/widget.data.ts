export interface RssArticle {
  title: string;
  link: string;
  pubDate: Date;
  source: string;
  thumbnail?: string;
}

export interface RSSFeed {
  url: string;
  headers?: Record<string, string>;
}

export interface CalendarEvent {
  uid: string;
  title: string;
  start: Date;
  end?: Date;
  color: string;
  location?: string;
  description?: string;
}

export interface RedditPost {
  title: string;
  link: string;
  pubDate: Date;
  author: string;
  score: number;
  numComments: number;
  subreddit: string;
  permalink: string;
  thumbnail?: string;
}

export interface RedditData {
  subreddit: string;
  sort: string;
  time?: string;
  posts: RedditPost[];
}

export interface WidgetData {
  data: any;
  params: Record<string, any>;
}
