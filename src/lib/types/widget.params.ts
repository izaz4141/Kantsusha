import { z } from 'zod';

export const TIME_REGEX = /^(\d+)(s|m|h|d|w|mo|y)$/;

export const REDDIT_SORT_REGEX = /^(top|hot|new|controversial)$/;
export const REDDIT_TIME_REGEX = /^(hour|day|week|month|year|all)$/;

export const TARGET_REGEX = /^(_blank|_self|_parent|_top)$/;

export const WidgetTypeSchema = z.enum(['calendar', 'rss', 'reddit', 'services', 'tabbed']);
export type WidgetType = z.infer<typeof WidgetTypeSchema>;

const CommonWidgetParamsSchema = z.object({
  title: z.string().optional(),
  cache: z.string().optional(),
  update: z.string().regex(TIME_REGEX).optional(),
});
export type CommonWidgetParams = z.infer<typeof CommonWidgetParamsSchema>;

export const ICalFeedSchema = z.object({
  url: z.string(),
  color: z.string().optional(),
  headers: z.record(z.string(), z.string()).optional(),
});
export type ICalFeed = z.infer<typeof ICalFeedSchema>;

export const CalendarParamsSchema = CommonWidgetParamsSchema.merge(
  z.object({
    type: z.literal('calendar'),
    icals: z.array(ICalFeedSchema).min(1),
    limit: z.number().int().positive().default(50),
  }),
);
export type CalendarParams = z.infer<typeof CalendarParamsSchema>;

export const RssFeedSchema = z.object({
  url: z.string(),
  headers: z.record(z.string(), z.string()).optional(),
});
export type RssFeed = z.infer<typeof RssFeedSchema>;

export const RssParamsSchema = CommonWidgetParamsSchema.merge(
  z.object({
    type: z.literal('rss'),
    title: z.string().default('RSS Feed'),
    showThumbnail: z.boolean().default(false),
    collapseAfter: z.number().int().positive().default(5),
    limit: z.number().int().positive().default(10),
    feeds: z.array(RssFeedSchema).min(1),
  }),
);
export type RssParams = z.infer<typeof RssParamsSchema>;

export const RedditParamsSchema = CommonWidgetParamsSchema.merge(
  z.object({
    type: z.literal('reddit'),
    subreddit: z.string().min(1),
    sort: z.string().regex(REDDIT_SORT_REGEX).default('top'),
    time: z.string().regex(REDDIT_TIME_REGEX).default('month'),
    limit: z.number().int().positive().default(10),
    showThumbnail: z.boolean().default(false),
    collapseAfter: z.number().int().positive().default(5),
  }),
).overwrite((data) => {
  return {
    ...data,
    title: data.title ?? `r/${data.subreddit}`,
  };
});
export type RedditParams = z.infer<typeof RedditParamsSchema>;

export const ContainerParamsSchema = z.object({
  type: z.literal('container'),
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  url: z.string().optional(),
  icon: z.string().optional(),
  target: z.string().regex(TARGET_REGEX).default('_blank').optional(),
  sockPath: z.string().optional(),
});
export type ContainerParams = z.infer<typeof ContainerParamsSchema>;

export const EndpointParamsSchema = z.object({
  type: z.literal('endpoint'),
  name: z.string(),
  description: z.string().optional(),
  url: z.string(),
  icon: z.string().optional(),
  target: z.string().regex(TARGET_REGEX).default('_blank').optional(),
  statusCheck: z.boolean().optional(),
  statusCheckUrl: z.string().optional(),
});
export type EndpointParams = z.infer<typeof EndpointParamsSchema>;

export const ServicesParamsSchema = CommonWidgetParamsSchema.merge(
  z.object({
    type: z.literal('services'),
    target: z.string().regex(TARGET_REGEX).default('_blank').optional(),
    column: z.number().int().positive().default(3),
    services: z.discriminatedUnion('type', [ContainerParamsSchema, EndpointParamsSchema]).array(),
  }),
);
export type ServicesParams = z.infer<typeof ServicesParamsSchema>;

const BaseWidgetParamsSchema = z.discriminatedUnion('type', [
  CalendarParamsSchema,
  RssParamsSchema,
  RedditParamsSchema,
  ServicesParamsSchema,
]);
export type BaseWidgetParams = z.infer<typeof BaseWidgetParamsSchema>;

export const TabbedParamsSchema = CommonWidgetParamsSchema.merge(
  z.object({
    type: z.literal('tabbed'),
    id: z.string().default('N/A'),
    widgets: z.array(BaseWidgetParamsSchema).min(1),
  }),
);
export type TabbedParams = z.infer<typeof TabbedParamsSchema>;

const WrapperWidgetParams = z.discriminatedUnion('type', [TabbedParamsSchema]);
export type WrapperParams = z.infer<typeof WrapperWidgetParams>;

export const AnyWidgetParamsSchema = z.discriminatedUnion('type', [
  ...BaseWidgetParamsSchema.options,
  ...WrapperWidgetParams.options,
]);
export type AnyWidgetParams = z.infer<typeof AnyWidgetParamsSchema>;
