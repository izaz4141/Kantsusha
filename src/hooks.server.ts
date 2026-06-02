import type { Handle, ServerInit } from '@sveltejs/kit';
import { building } from '$app/environment';
import { auth } from '$lib/server/auth';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import type { HandleServerError } from '@sveltejs/kit';
import { getPreset, getCached } from '$lib/server/config/config';
import { sequence } from '@sveltejs/kit/hooks';
import logger from '$lib/server/logger';

export const init: ServerInit = async () => {
  if (building) return;
  process.on('uncaughtException', (err) => {
    logger.error(err, 'FATAL uncaughtException');
  });
  process.on('unhandledRejection', (reason) => {
    logger.error(reason as Error, 'FATAL unhandledRejection');
  });
  logger.info('Initializing Server...');
  await getCached();
  logger.info('Kantsusha Ready!');
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

  let theme: string = cache.theme.default;

  if (themeCookie && themeCookie in cache.theme.presets) {
    theme = themeCookie;
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
  logger.error(err, `SERVER: ${event.url.pathname}`);

  return {
    message: 'A server-side error occurred.',
    code: err?.code ?? 'UNKNOWN',
  };
};
