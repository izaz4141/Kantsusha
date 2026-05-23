import { z } from 'zod';

const colorKeys = [
  'background',
  'surface',
  'surfaceRaised',
  'surfaceSunken',
  'text',
  'textMuted',
  'textOnPrimary',
  'primary',
  'primaryHover',
  'primaryActive',
  'secondary',
  'success',
  'warning',
  'error',
  'info',
  'border',
  'borderStrong',
  'ring',
  'overlay',
] as const;

const ThemeColorShape: Record<string, z.ZodString> = {};
for (const key of colorKeys) ThemeColorShape[key] = z.string();

export const ThemeColorsSchema = z.object(ThemeColorShape);
export type ThemeColors = z.infer<typeof ThemeColorsSchema>;

export const ThemePresetSchema = z.object({
  name: z.string(),
  colorScheme: z.string().default('dark'),
  colors: ThemeColorsSchema.partial(),
});
export type ThemePreset = z.infer<typeof ThemePresetSchema>;

export const RawPresetSchema = z.object({
  name: z.string(),
  light: z.boolean().optional(),
  colors: ThemeColorsSchema.partial().optional(),
});
