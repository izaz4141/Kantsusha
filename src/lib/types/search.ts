import { z } from 'zod';
import { TARGET_REGEX } from '$lib/utils/constants';

export const SearchEngineSchema = z.object({
  queryUrl: z.string(),
  autoCompleteUrl: z.string().optional(),
  bang: z.string().optional(),
});
export type SearchEngine = z.infer<typeof SearchEngineSchema>;

export const SearchConfigSchema = z.object({
  enabled: z.boolean().default(false),
  triggerKey: z.string().default('/'),
  target: z.string().regex(TARGET_REGEX).default('_blank'),
  default: z.string().optional(),
  engines: z.record(z.string(), SearchEngineSchema),
});

export type SearchConfig = z.infer<typeof SearchConfigSchema>;
