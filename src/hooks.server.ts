import type { Handle, ServerInit } from '@sveltejs/kit';
import { building } from '$app/environment';
import { auth } from '$lib/server/auth';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import type { HandleServerError } from '@sveltejs/kit';
import { DEFAULT_THEME } from '$lib/utils/constants';
import { getPreset, getCached } from '$lib/server/config/config';
import { sequence } from '@sveltejs/kit/hooks';

export const init: ServerInit = async () => {
  if (building) return;
  console.log('Initializing Server...');
  await getCached();
  console.log('Kantsusha Ready!');
};

const handleBetterAuth: Handle = async ({ event, resolve }) => {
  const session = await auth.api.getSession({ headers: event.request.headers });

  if (session) {
    event.locals.session = session.session;
    event.locals.user = session.user;
  }

  return svelteKitHandler({ event, resolve, auth, building });
};

const handleTheming: Handle = async ({ event, resolve }) => {
  const themeCookie = event.cookies.get('Kantussha-theme');
  const cache = await getCached();

  let theme: string;

  if (themeCookie && themeCookie in cache.presets) {
    theme = themeCookie;
  } else {
    const userAgent: string = event.request.headers.get('user-agent') || '';
    const prefersDark: boolean = /dark|android|iphone|ipad/i.test(userAgent);
    const preferredColorScheme: string = prefersDark ? 'dark' : 'light';
    const matchingPreset = Object.entries(cache.presets).find(
      ([_, preset]) => preset.colorScheme === preferredColorScheme,
    );
    theme = matchingPreset ? matchingPreset[0] : DEFAULT_THEME;
  }

  const preset = await getPreset(theme);

  return await resolve(event, {
    transformPageChunk: ({ html }) =>
      html.replace('%theme%', theme).replace('%colorScheme%', preset.colorScheme),
  });
};

export const handle: Handle = sequence(handleBetterAuth, handleTheming);

interface AppError {
  code?: string;
  message?: string;
  stack?: string;
}
export const handleError: HandleServerError = ({ error, event }) => {
  const err = error as AppError;
  console.error('SERVER:', event.url.pathname, err?.message ?? error);

  return {
    message: 'A server-side error occurred.',
    code: err?.code ?? 'UNKNOWN',
  };
};
