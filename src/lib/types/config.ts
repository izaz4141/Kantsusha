import { z } from 'zod';
import logger from '$lib/server/logger';
import { RawPresetSchema, ThemePresetSchema, type ThemePreset } from '$lib/types/theme';
import { PageConfigSchema } from '$lib/types/pages';
import { SearchConfigSchema } from '$lib/types/search';

export const ConfigSchema = z.object({
  search: SearchConfigSchema,
  theme: z.object({
    default: z.string().default('dark'),
    presets: z
      .record(z.string(), RawPresetSchema)
      .optional()
      .transform((presets) => {
        if (!presets) return {} as Record<string, ThemePreset>;
        const valid: Record<string, ThemePreset> = {};
        for (const [name, raw] of Object.entries(presets)) {
          const result = ThemePresetSchema.safeParse({
            name: raw.name,
            colorScheme: raw.light === false ? 'dark' : 'light',
            colors: raw.colors ?? {},
          });
          if (result.success) {
            valid[name] = result.data;
          } else {
            logger.warn(`Preset "${name}" invalid`);
          }
        }
        return valid;
      }),
  }),
  pages: z
    .array(PageConfigSchema)
    .optional()
    .default([])
    .transform((pages) => {
      return pages.flatMap((page) => {
        const columns = page.columns.filter((col) => col.widgets.length > 0);
        if (columns.length === 0) {
          logger.warn(`Page "${page.name}" has no columns`);
          return [];
        }
        return [{ ...page, columns }];
      });
    }),
});

export type ParsedConfig = z.infer<typeof ConfigSchema>;
