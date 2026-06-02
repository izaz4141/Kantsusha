import { z } from 'zod';
import {
  TIME_REGEX,
  REDDIT_SORT_REGEX,
  REDDIT_TIME_REGEX,
  TARGET_REGEX,
  CSS_PERCENT_REGEX,
} from '$lib/utils/constants';

const CommonWidgetParamsSchema = z.object({
  title: z.string().optional(),
  cache: z.string().regex(TIME_REGEX).default('1h').optional(),
  update: z.string().regex(TIME_REGEX).default('1h').optional(),
  frameless: z.boolean().default(false).optional(),
  lazy: z.boolean().default(false),
});
export type CommonWidgetParams = z.infer<typeof CommonWidgetParamsSchema>;

export const FeedWidgetParamsSchema = CommonWidgetParamsSchema.merge(
  z.object({
    showThumbnail: z.boolean().default(false),
    collapseAfter: z.number().int().positive().default(5),
    limit: z.number().int().positive().default(10),
    view: z.enum(['list', 'card']).default('list'),
    sort: z.boolean().default(true),
  }),
);
export type FeedWidgetParams = z.infer<typeof FeedWidgetParamsSchema>;

export const CalFeedSchema = z.object({
  type: z.enum(['ics', 'caldav']).default('ics'),
  url: z.string(),
  color: z.string().optional(),
  headers: z.record(z.string(), z.string()).optional(),
});
export type CalFeed = z.infer<typeof CalFeedSchema>;

export const CalendarParamsSchema = CommonWidgetParamsSchema.merge(
  z.object({
    type: z.literal('calendar'),
    cals: z.array(CalFeedSchema).optional(),
    range: z.string().regex(TIME_REGEX).default('183d'),
    limit: z.number().int().positive().default(50),
  }),
);
export type CalendarParams = z.infer<typeof CalendarParamsSchema>;

export const RssFeedSchema = z.object({
  url: z.string(),
  headers: z.record(z.string(), z.string()).optional(),
  limit: z.number().int().positive().optional(),
});
export type RssFeed = z.infer<typeof RssFeedSchema>;

export const RssParamsSchema = FeedWidgetParamsSchema.merge(
  z.object({
    type: z.literal('rss'),
    title: z.string().default('RSS Feed'),
    feeds: z.array(RssFeedSchema).min(1),
  }),
);
export type RssParams = z.infer<typeof RssParamsSchema>;

export const RedditParamsSchema = FeedWidgetParamsSchema.merge(
  z.object({
    type: z.literal('reddit'),
    subreddit: z.string(),
    sort: z.string().regex(REDDIT_SORT_REGEX).default('top'),
    time: z.string().regex(REDDIT_TIME_REGEX).default('month'),
  }),
).overwrite((data) => {
  return {
    ...data,
    title: data.title ?? `r/${data.subreddit}`,
  };
});
export type RedditParams = z.infer<typeof RedditParamsSchema>;

export const YouTubeChannelSchema = z.object({
  channel: z.string(),
  limit: z.number().int().positive().optional(),
});
export type YouTubeChannel = z.infer<typeof YouTubeChannelSchema>;

export const YouTubeParamsSchema = FeedWidgetParamsSchema.merge(
  z.object({
    type: z.literal('youtube'),
    title: z.string().default('YouTube'),
    frameless: z.boolean().default(true),
    channels: z.array(YouTubeChannelSchema).min(1),
    view: z.enum(['list', 'card']).default('card'),
    includeShorts: z.boolean().default(false),
  }),
);
export type YouTubeParams = z.infer<typeof YouTubeParamsSchema>;

export const TwitchChannelParamsSchema = CommonWidgetParamsSchema.merge(
  z.object({
    type: z.literal('twitch-channel'),
    title: z.string().default('Twitch Channels'),
    channels: z.array(z.string()).min(1),
    sort: z.enum(['live', 'views']).default('live'),
  }),
);
export type TwitchChannelParams = z.infer<typeof TwitchChannelParamsSchema>;

export const MarketEntrySchema = z.object({
  code: z.string(),
  range: z.string().regex(TIME_REGEX).default('30d').optional(),
  interval: z.string().regex(TIME_REGEX).default('1d').optional(),
});
export type MarketEntry = z.infer<typeof MarketEntrySchema>;

export const MarketsParamsSchema = CommonWidgetParamsSchema.merge(
  z.object({
    type: z.literal('markets'),
    title: z.string().default('Markets'),
    frameless: z.boolean().default(true),
    markets: z.array(MarketEntrySchema).min(1),
  }),
);
export type MarketsParams = z.infer<typeof MarketsParamsSchema>;

export const ContainerParamsSchema = z.object({
  type: z.literal('container'),
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  url: z.string().optional(),
  icon: z.string().optional(),
  target: z.string().regex(TARGET_REGEX).optional(),
  sockPath: z.string().optional(),
});
export type ContainerParams = z.infer<typeof ContainerParamsSchema>;

export const EndpointParamsSchema = z.object({
  type: z.literal('endpoint'),
  name: z.string(),
  description: z.string().optional(),
  url: z.string(),
  icon: z.string().optional(),
  target: z.string().regex(TARGET_REGEX).optional(),
  statusCheck: z.boolean().optional(),
  statusCheckUrl: z.string().optional(),
});
export type EndpointParams = z.infer<typeof EndpointParamsSchema>;

export const ServicesParamsSchema = CommonWidgetParamsSchema.merge(
  z.object({
    type: z.literal('services'),
    title: z.string().default('Services'),
    target: z.string().regex(TARGET_REGEX).default('_blank').optional(),
    column: z.number().int().positive().default(3),
    services: z.discriminatedUnion('type', [ContainerParamsSchema, EndpointParamsSchema]).array(),
  }),
);
export type ServicesParams = z.infer<typeof ServicesParamsSchema>;

export const ApiRequestSchema = z.object({
  method: z.enum(['get', 'post']).default('get'),
  url: z.string(),
  type: z.enum(['text', 'json']).default('json'),
  headers: z.record(z.string(), z.string()).optional(),
  body: z.string().optional(),
});
export type ApiRequest = z.infer<typeof ApiRequestSchema>;

export const CustomApiParamsSchema = CommonWidgetParamsSchema.merge(
  z.object({
    type: z.literal('custom-api'),
    options: z.record(z.string(), z.unknown()).optional(),
    fetch: z.record(z.string(), ApiRequestSchema).optional(),
    template: z.string(),
  }),
);
export type CustomApiParams = z.infer<typeof CustomApiParamsSchema>;

export const ServerSourceFiltersSchema = z.object({
  networkInterfaces: z.array(z.string()).optional(),
  diskDevices: z.array(z.string()).optional(),
  mountPoints: z.array(z.string()).optional(),
});
export type ServerSourceFilters = z.infer<typeof ServerSourceFiltersSchema>;

const ServerSourceSchema = z.union([
  z.object({ host: ServerSourceFiltersSchema }),
  z.object({
    beszel: z.object({
      url: z.string(),
      email: z.string(),
      password: z.string(),
      systemIds: z.record(z.string(), ServerSourceFiltersSchema).optional(),
    }),
  }),
]);

export const ServerStatsParamsSchema = CommonWidgetParamsSchema.merge(
  z.object({
    type: z.literal('server-stats'),
    title: z.string().default('Server Stats'),
    cache: z.string().regex(TIME_REGEX).default('15m').optional(),
    update: z.string().regex(TIME_REGEX).default('15m').optional(),
    source: ServerSourceSchema.default({ host: {} }),
    showCpu: z.boolean().default(true),
    showMemory: z.boolean().default(true),
    showSwap: z.boolean().default(true),
    showUptime: z.boolean().default(true),
    showPlatform: z.boolean().default(true),
    showTemperature: z.boolean().default(true),
    showStorage: z.boolean().default(true),
    showNetwork: z.boolean().default(true),
    showDiskIO: z.boolean().default(true),
  }),
);
export type ServerStatsParams = z.infer<typeof ServerStatsParamsSchema>;

const BaseWidgetParamsSchema = z.discriminatedUnion('type', [
  CalendarParamsSchema,
  RssParamsSchema,
  RedditParamsSchema,
  YouTubeParamsSchema,
  ServicesParamsSchema,
  CustomApiParamsSchema,
  TwitchChannelParamsSchema,
  MarketsParamsSchema,
  ServerStatsParamsSchema,
]);
export type BaseWidgetParams = z.infer<typeof BaseWidgetParamsSchema>;

export const TabbedParamsSchema = CommonWidgetParamsSchema.merge(
  z.object({
    type: z.literal('tabbed'),
    id: z.string().default('N/A'),
    widgets: z.lazy((): z.ZodArray => z.array(WrapperWidgetEntrySchema).min(1)),
  }),
);
export type TabbedParams = z.infer<typeof TabbedParamsSchema>;

export const SplitColumnParamsSchema = CommonWidgetParamsSchema.merge(
  z.object({
    type: z.literal('split-column'),
    id: z.string().default('N/A'),
    widgets: z.lazy((): z.ZodArray => z.array(WrapperWidgetEntrySchema).min(1)),
  }),
);
export type SplitColumnParams = z.infer<typeof SplitColumnParamsSchema>;

export const SplitRowParamsSchema = CommonWidgetParamsSchema.merge(
  z.object({
    type: z.literal('split-row'),
    id: z.string().default('N/A'),
    widgets: z.lazy((): z.ZodArray => z.array(WrapperWidgetEntrySchema).min(1)),
  }),
);
export type SplitRowParams = z.infer<typeof SplitRowParamsSchema>;

export const WrapperWidgetParamsSchema = z.discriminatedUnion('type', [
  TabbedParamsSchema,
  SplitColumnParamsSchema,
  SplitRowParamsSchema,
]);
export type WrapperWidgetParams = z.infer<typeof WrapperWidgetParamsSchema>;

export const AnyWidgetParamsSchema = z.discriminatedUnion('type', [
  ...BaseWidgetParamsSchema.options,
  ...WrapperWidgetParamsSchema.options,
]);
export type AnyWidgetParams = z.infer<typeof AnyWidgetParamsSchema>;

export const WrapperWidgetEntrySchema = AnyWidgetParamsSchema.and(
  z.object({ size: z.string().regex(CSS_PERCENT_REGEX).optional() }),
);
export type WrapperWidgetEntry = z.infer<typeof WrapperWidgetEntrySchema>;
