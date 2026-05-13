import type { AnyWidgetParams, BaseWidgetParams, WrapperParams } from './widget.params';

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

export interface ContainerData {
  name: string;
  image: string;
  status: 'running' | 'exited' | 'paused' | 'restarting' | 'created' | 'removing' | 'dead';
  health: 'healthy' | 'unhealthy' | 'starting' | null;
  state: string;
  statusText: string;
  cpuPercent: number;
  memoryUsage: number;
  memoryLimit: number;
  memoryPercent: number;
}

export interface EndpointData {
  name: string;
  status: 'online' | 'offline' | 'unknown';
  statusCode?: number;
  responseTime?: number;
}

export interface TabbedData {
  ids: string[];
  widgets: BaseWidgetParams[] | [];
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
  css: string;
}

export type BaseWidgetData =
  | RssArticle[]
  | CalendarEvent[]
  | RedditPost[]
  | ContainerData[]
  | EndpointData[]
  | (ContainerData | EndpointData)[]
  | CustomApiData;
export interface BaseWidgetInfo {
  data: BaseWidgetData;
  params: BaseWidgetParams;
}

export type WrapperWidgetData = TabbedData;
export interface WrapperWidgetInfo {
  data: WrapperWidgetData;
  params: WrapperParams;
}

export type AnyWidgetData = BaseWidgetData | WrapperWidgetData;
export interface AnyWidgetInfo {
  data: AnyWidgetData;
  params: AnyWidgetParams;
}
