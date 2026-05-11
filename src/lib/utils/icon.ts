import { themeState } from '$lib/theme/store.svelte';

const PREFIXES = {
  si: 'https://simpleicons.org/icons', // ex: https://simpleicons.org/icons/photopea.svg
  sh: 'https://cdn.jsdelivr.net/gh/selfhst/icons@main', // ex: https://cdn.jsdelivr.net/gh/selfhst/icons@main/svg/photopea.svg
  di: 'https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons', // ex: https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/svg/photopea.svg
} as const;

export interface ResolveResult {
  url: string;
  invert: boolean;
}

export function resolveIcon(input: string): ResolveResult | null {
  if (!input || typeof input !== 'string') return null;

  let invert = false;
  let remaining = input;

  if (remaining.startsWith('auto-invert ')) {
    invert = true;
    remaining = remaining.slice('auto-invert '.length);
  }

  for (const [prefix, baseUrl] of Object.entries(PREFIXES)) {
    if (remaining.startsWith(`${prefix}:`)) {
      const icon = remaining.slice(prefix.length + 1);
      const hasExt = icon.includes('.');

      if (hasExt) {
        const ext = icon.split('.').pop()!;
        const name = icon.slice(0, -(ext.length + 1));
        return {
          url: `${baseUrl}/${ext}/${name}.${ext}`,
          invert,
        };
      }

      return {
        url: `${baseUrl}/svg/${icon}.svg`,
        invert,
      };
    }
  }

  if (remaining.startsWith('http://') || remaining.startsWith('https://')) {
    return { url: remaining, invert };
  }

  if (remaining.startsWith('/')) {
    return { url: remaining, invert };
  }

  return null;
}

export function shouldInvert(invert: boolean): boolean {
  if (!invert) return false;
  const preset = themeState.presets[themeState.current];
  return preset?.colorScheme === 'dark';
}
