import { betterAuth, type Auth, type BetterAuthOptions } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { dev } from '$app/environment';
import { getRequestEvent } from '$app/server';
import { db } from '$lib/server/db';
import * as schema from '$lib/server/db/auth.schema';

const rawOrigins =
  process.env.KANTSUSHA_ORIGINS?.split(',')
    .map((o) => o.trim())
    .filter(Boolean) ?? [];
const origins = rawOrigins.length > 0 ? rawOrigins : ['http://localhost:*', 'http://127.0.0.1:*'];
const allowedHosts = origins.map((url) => {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
});

const authOptions = {
  baseURL: {
    allowedHosts,
    protocol: dev ? 'http' : 'https',
  },
  secret: process.env.KANTSUSHA_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: 'sqlite',
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  emailAndPassword: { enabled: true },
  plugins: [sveltekitCookies(getRequestEvent)],
} satisfies BetterAuthOptions;

/**
 * `betterAuth()` must not run during `vite build`, otherwise it throws because
 * no auth secret is available yet (it is only injected at runtime via
 * `KANTSUSHA_AUTH_SECRET` / Docker env). Construction is deferred until the
 * first real use, which only ever happens at request time.
 */
type AuthInstance = Auth<typeof authOptions>;

let cachedAuth: AuthInstance | undefined;
export const auth: AuthInstance = new Proxy({} as AuthInstance, {
  get(_target, prop) {
    if (!cachedAuth) cachedAuth = betterAuth(authOptions);
    const value = (cachedAuth as unknown as Record<string, unknown>)[prop as string];
    return typeof value === 'function' ? value.bind(cachedAuth) : value;
  },
});
