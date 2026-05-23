import { z } from 'zod';
import { RawPresetSchema, ThemePresetSchema, type ThemePreset } from '$lib/types/theme';
import { PageConfigSchema } from '$lib/types/pages';

export const ConfigSchema = z.object({
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
          console.warn(`Preset "${name}" validation failed: ${result.error.message}`);
        }
      }
      return valid;
    }),
  pages: z
    .array(PageConfigSchema)
    .optional()
    .default([])
    .transform((pages) => {
      return pages.flatMap((page) => {
        const columns = page.columns.filter((col) => col.widgets.length > 0);
        if (columns.length === 0) {
          console.warn(`Page "${page.name}" has no valid columns, skipping`);
          return [];
        }
        return [{ ...page, columns }];
      });
    }),
});

export type ParsedConfig = z.infer<typeof ConfigSchema>;
