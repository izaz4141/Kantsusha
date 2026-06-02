import type { ThemePreset } from '$lib/types/theme';

export const themeState = $state<{
  current: string;
  css: string;
  presets: Record<string, ThemePreset>;
}>({
  current: 'dark',
  css: '',
  presets: {},
});

export function setThemeCookie(name: string): void {
  if (typeof document === 'undefined') return;
  if (name && name in themeState.presets) {
    document.cookie = `Kantussha-theme=${name}; path=/; max-age=${60 * 60 * 24 * 365} SameSite=Lax`;
  }
}
