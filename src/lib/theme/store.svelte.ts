// import { generateCSS, loadThemeConfig } from '$lib/server/theme';
import type { ThemePreset, ThemeColors } from './types';

export const defaultTheme: string = 'light';
export const DEFAULT_COLORS: ThemeColors = {
  background: '#ffffff',
  surface: '#f8f9fa',
  surfaceRaised: '#ffffff',
  surfaceSunken: '#f3f4f6',
  text: '#1a1a1a',
  textMuted: '#6b7280',
  textOnPrimary: '#ffffff',
  primary: '#3b82f6',
  primaryHover: '#2563eb',
  primaryActive: '#1d4ed8',
  secondary: '#6366f1',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
  border: '#e5e7eb',
  borderStrong: '#d1d5db',
  ring: 'rgba(59, 130, 246, 0.5)',
  overlay: 'rgba(0, 0, 0, 0.4)',
};

export const themeState = $state<{
  current: string;
  css: string;
  presets: Record<string, ThemePreset>;
}>({
  current: defaultTheme,
  css: '',
  presets: {},
});

export function setThemeCookie(name: string): void {
  if (typeof document === 'undefined') return;
  if (name && name in themeState.presets) {
    document.cookie = `Kantussha-theme=${name}; path=/; max-age=${60 * 60 * 24 * 365} SameSite=Lax`;
  }
}
