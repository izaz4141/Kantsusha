import type { AnyWidgetParams, BaseWidgetParams, ContainerParams } from './widget.params';

export interface DockerContainerData {
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

export interface TabbedData {
  ids: string[];
  widgets: BaseWidgetParams[] | [];
}

export type BaseWidgetData = RssArticle[] | CalendarEvent[] | RedditPost[] | DockerContainerData[];
export interface BaseWidgetInfo {
  data: BaseWidgetData;
  params: BaseWidgetParams;
}

export type ContainerWidgetData = TabbedData;
export interface ContainerWidgetInfo {
  data: ContainerWidgetData;
  params: ContainerParams;
}

export type AnyWidgetData = BaseWidgetData | ContainerWidgetData;
export interface AnyWidgetInfo {
  data: AnyWidgetData;
  params: AnyWidgetParams;
}
