import { z } from 'zod';
import { CSS_UNIT_REGEX } from '$lib/utils/constants';
import { AnyWidgetParamsSchema, type AnyWidgetParams } from '$lib/types/widget.params';

export const PageColumnSchema = z.object({
  size: z
    .union([z.enum(['small', 'full']), z.string().regex(CSS_UNIT_REGEX)])
    .optional()
    .default('full'),
  widgets: z
    .array(z.any())
    .transform((items) =>
      items.flatMap((item) => {
        try {
          return AnyWidgetParamsSchema.parse(item);
        } catch {
          const type =
            item && typeof item === 'object' ? (item as Record<string, unknown>).type : typeof item;
          console.warn(`Widget "${type}" validation failed, skipping`);
          return [];
        }
      }),
    )
    .optional()
    .default([]),
});

export const PageConfigSchema = z.object({
  name: z.string(),
  layout: z.string().optional().default('default'),
  columns: z.array(PageColumnSchema).optional().default([]),
});

export type PageColumn = z.infer<typeof PageColumnSchema>;
export type PageConfig = z.infer<typeof PageConfigSchema>;
