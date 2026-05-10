import { defaultTheme } from '$lib/theme/store.svelte';
import { getThemeCSS, getCached, getPages } from '$lib/server/config/config';

export const load = async ({
  cookies,
  request,
}: {
  cookies: { get: (name: string) => string | undefined };
  request: { headers: { get: (name: string) => string | null } };
}) => {
  const themeCookie = cookies.get('Kantussha-theme');
  const cache = await getCached();

  let theme: string = defaultTheme;

  if (themeCookie && themeCookie in cache.presets) {
    theme = themeCookie;
  } else {
    const userAgent: string = request.headers.get('user-agent') || '';
    const prefersDark: boolean = /dark|android|iphone|ipad/i.test(userAgent);
    const preferredColorScheme: string = prefersDark ? 'dark' : 'light';
    const matchingPreset = Object.entries(cache.presets).find(
      ([_, preset]) => preset.colorScheme === preferredColorScheme,
    );
    if (matchingPreset) {
      theme = matchingPreset[0];
    }
  }

  const pages = await getPages();
  const routes = pages.map((page) => ({
    name: page.name,
    slug: page.name.toLowerCase().replace(/\s+/g, '-'),
  }));

  const css = await getThemeCSS();

  return {
    theme: {
      name: theme,
      css,
      presets: cache.presets,
    },
    routes,
  };
};
