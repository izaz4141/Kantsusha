import type { ThemePreset } from '$lib/types/theme';

function toKebabCase(str: string): string {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
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
