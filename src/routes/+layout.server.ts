import { getThemeCSS, getCached, getPages, getSearchConfig } from '$lib/server/config/config';

export const load = async ({
  cookies,
  request,
}: {
  cookies: { get: (name: string) => string | undefined };
  request: { headers: { get: (name: string) => string | null } };
}) => {
  const themeCookie = cookies.get('Kantussha-theme');
  const cache = await getCached();

  let theme: string = cache.theme.default;

  if (themeCookie && themeCookie in cache.theme.presets) {
    theme = themeCookie;
  }

  const pages = await getPages();
  const routes = pages.map((page) => ({
    name: page.name,
    slug: page.name.toLowerCase().replace(/\s+/g, '-'),
  }));

  const css = await getThemeCSS();
  const search = await getSearchConfig();

  return {
    theme: {
      name: theme,
      css,
      presets: cache.theme.presets,
    },
    routes,
    search,
  };
};
