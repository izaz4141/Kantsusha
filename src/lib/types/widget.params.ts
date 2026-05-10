import { z } from 'zod';

export const TIME_REGEX = /^(\d+)(s|m|h|d|w|mo|y)$/;

export const REDDIT_SORT_REGEX = /^(top|hot|new|controversial)$/;
export const REDDIT_TIME_REGEX = /^(hour|day|week|month|year|all)$/;

export const WidgetTypeSchema = z.enum([
  'calendar',
  'rss',
  'reddit',
  'docker-containers',
  'tabbed',
]);
export type WidgetType = z.infer<typeof WidgetTypeSchema>;

export const ICalFeedSchema = z.object({
  url: z.string(),
  color: z.string().optional(),
  headers: z.record(z.string(), z.string()).optional(),
});
export type ICalFeed = z.infer<typeof ICalFeedSchema>;

export const CalendarParamsSchema = z.object({
  type: z.literal('calendar'),
  title: z.string().optional(),
  cache: z.string().optional(),
  update: z.string().regex(TIME_REGEX).optional(),
  icals: z.array(ICalFeedSchema).min(1),
  limit: z.number().int().positive().default(50),
});
export type CalendarParams = z.infer<typeof CalendarParamsSchema>;

export const RssFeedSchema = z.object({
  url: z.string(),
  headers: z.record(z.string(), z.string()).optional(),
});
export type RssFeed = z.infer<typeof RssFeedSchema>;

export const RssParamsSchema = z.object({
  type: z.literal('rss'),
  title: z.string().default('RSS Feed'),
  cache: z.string().optional(),
  update: z.string().regex(TIME_REGEX).optional(),
  showThumbnail: z.boolean().default(false),
  collapseAfter: z.number().int().positive().default(5),
  limit: z.number().int().positive().default(10),
  feeds: z.array(RssFeedSchema).min(1),
});
export type RssParams = z.infer<typeof RssParamsSchema>;

export const RedditParamsSchema = z
  .object({
    type: z.literal('reddit'),
    title: z.string().optional(),
    cache: z.string().optional(),
    update: z.string().regex(TIME_REGEX).optional(),
    subreddit: z.string().min(1),
    sort: z.string().regex(REDDIT_SORT_REGEX).default('top'),
    time: z.string().regex(REDDIT_TIME_REGEX).default('month'),
    limit: z.number().int().positive().default(10),
    showThumbnail: z.boolean().default(false),
    collapseAfter: z.number().int().positive().default(5),
  })
  .overwrite((data) => {
    return {
      ...data,
      title: data.title ?? `r/${data.subreddit}`,
    };
  });
export type RedditParams = z.infer<typeof RedditParamsSchema>;

export const DockerContainerSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  url: z.string().optional(),
  icon: z.string().optional(),
});
export type DockerContainer = z.infer<typeof DockerContainerSchema>;

export const DockerContainersParamsSchema = z.object({
  type: z.literal('docker-containers'),
  title: z.string().optional(),
  cache: z.string().optional(),
  update: z.string().regex(TIME_REGEX).optional(),
  sockPath: z.string().optional(),
  column: z.number().int().positive().default(3),
  containers: z.record(z.string(), DockerContainerSchema),
});
export type DockerContainersParams = z.infer<typeof DockerContainersParamsSchema>;

const BaseWidgetParamsSchema = z.discriminatedUnion('type', [
  CalendarParamsSchema,
  RssParamsSchema,
  RedditParamsSchema,
  DockerContainersParamsSchema,
]);
export type BaseWidgetParams = z.infer<typeof BaseWidgetParamsSchema>;

export const TabbedParamsSchema = z.object({
  type: z.literal('tabbed'),
  id: z.string().default('N/A'),
  cache: z.string().optional(),
  update: z.string().regex(TIME_REGEX).optional(),
  widgets: z.array(BaseWidgetParamsSchema).min(1),
});
export type TabbedParams = z.infer<typeof TabbedParamsSchema>;

const ContainerWidgetParams = z.discriminatedUnion('type', [TabbedParamsSchema]);
export type ContainerParams = z.infer<typeof ContainerWidgetParams>;

export const AnyWidgetParamsSchema = z.discriminatedUnion('type', [
  ...BaseWidgetParamsSchema.options,
  ...ContainerWidgetParams.options,
]);
export type AnyWidgetParams = z.infer<typeof AnyWidgetParamsSchema>;
