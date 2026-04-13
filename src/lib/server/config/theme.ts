import type { ThemePreset } from '$lib/theme/types';
import { DEFAULT_COLORS } from '$lib/theme/store.svelte';

export interface ThemeConfig {
  presets: Record<string, ThemePreset>;
}

function toKebabCase(str: string): string {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

function validatePreset(preset: unknown, name: string): ThemePreset | null {
  if (!preset || typeof preset !== 'object') {
    console.warn(`Warning: Invalid preset "${name}", skipping`);
    return null;
  }

  const p = preset as Record<string, unknown>;

  if (typeof p.name !== 'string') {
    console.warn(`Warning: Preset "${name}" missing "name", skipping`);
    return null;
  }

  const colorScheme = p.light === false ? 'dark' : 'light';

  const inputColors =
    p.colors && typeof p.colors === 'object' ? (p.colors as Record<string, unknown>) : {};

  const validKeys = Object.keys(DEFAULT_COLORS) as Array<keyof typeof DEFAULT_COLORS>;
  const filteredColors: Record<string, string> = {};

  for (const key of validKeys) {
    const providedValue = inputColors[key];
    if (typeof providedValue === 'string') {
      filteredColors[key] = providedValue;
    }
  }

  return {
    name: p.name,
    colorScheme,
    colors: filteredColors,
  };
}

export function parsePresets(rawPresets: unknown): Record<string, ThemePreset> {
  if (!rawPresets || typeof rawPresets !== 'object') {
    console.warn('Warning: Invalid presets format');
    return {};
  }

  const raw = rawPresets as Record<string, unknown>;
  const validPresets: Record<string, ThemePreset> = {};

  for (const [name, preset] of Object.entries(raw)) {
    const validPreset = validatePreset(preset, name);
    if (validPreset) {
      validPresets[name] = validPreset;
    }
  }

  return validPresets;
}

export function generateThemeCSS(presets: Record<string, ThemePreset>): string {
  let cssOutput = '';

  for (const [themeName, preset] of Object.entries(presets)) {
    const colors = preset.colors as Record<string, string>;
    const colorKeys = Object.keys(colors);

    if (colorKeys.length === 0) continue;

    cssOutput += `[data-theme='${themeName}'] {\n`;
    for (const colorName of colorKeys) {
      cssOutput += `  --color-${toKebabCase(colorName)}: ${colors[colorName]};\n`;
    }
    cssOutput += `}\n\n`;
  }

  return cssOutput;
}
