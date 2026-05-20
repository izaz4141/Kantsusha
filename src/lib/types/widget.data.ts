import type { AnyWidgetParams, BaseWidgetParams, WrapperWidgetParams } from './widget.params';

export interface RssArticle {
  title: string;
  link: string;
  pubDate: Date;
  source: string;
  thumbnail?: string;
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

export interface YouTubeVideo {
  title: string;
  videoId: string;
  pubDate: Date;
  channelTitle: string;
  thumbnail: string;
}

export interface TwitchChannel {
  username: string;
  nickname: string;
  avatarUrl: string;
  isLive: boolean;
  category?: string;
  categorySlug?: string;
  streamTitle?: string;
  viewerCount: number;
  startedAt?: Date;
  thumbnailUrl?: string;
}

export interface ContainerData {
  name: string;
  image: string;
  status:
    | 'running'
    | 'exited'
    | 'paused'
    | 'restarting'
    | 'created'
    | 'removing'
    | 'dead'
    | 'unknown';
  health: 'healthy' | 'unhealthy' | 'starting' | null;
  cpuPercent: number;
  memoryUsage: number;
  memoryLimit: number;
  memoryPercent: number;
  time: number | null;
}

export interface EndpointData {
  name: string;
  status: 'online' | 'offline' | 'unknown';
  statusCode?: number;
  responseTime?: number;
}

export interface FetchedData {
  id: string;
  type: 'text' | 'json';
  data: unknown;
  error?: string;
}

export interface CustomApiData {
  fetched: Record<string, FetchedData>;
  html: string;
  style: string;
  script: string;
}

export interface MarketData {
  code: string;
  displayName: string;
  currency: string;
  prices: number[];
  timestamps: number[];
  currentPrice: number;
  changePercent: number;
  lastTimestamp: number;
}

export type BaseWidgetData =
  | RssArticle[]
  | CalendarEvent[]
  | RedditPost[]
  | YouTubeVideo[]
  | TwitchChannel[]
  | ContainerData[]
  | EndpointData[]
  | (ContainerData | EndpointData)[]
  | CustomApiData
  | MarketData[];
export interface BaseWidgetInfo {
  data: BaseWidgetData;
  params: BaseWidgetParams;
}

export type WrapperWidgetData = { ids: string[] };
export interface WrapperWidgetInfo {
  data: WrapperWidgetData;
  params: WrapperWidgetParams;
}

export type AnyWidgetData = BaseWidgetData | WrapperWidgetData;
export interface AnyWidgetInfo {
  data: AnyWidgetData;
  params: AnyWidgetParams;
}
