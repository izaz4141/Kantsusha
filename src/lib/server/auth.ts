import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { env } from '$env/dynamic/private';
import { dev } from '$app/environment';
import { getRequestEvent } from '$app/server';
import { db } from '$lib/server/db';
import * as schema from '$lib/server/db/auth.schema';

const rawOrigins =
  env.KANTSUSHA_ORIGINS?.split(',')
    .map((o) => o.trim())
    .filter(Boolean) ?? [];
const origins = rawOrigins.length > 0 ? rawOrigins : ['http://localhost:*,http://127.0.0.1:*'];
const allowedHosts = origins.map((url) => {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
});

export const auth = betterAuth({
  baseURL: {
    allowedHosts,
    protocol: dev ? 'http' : 'https',
  },
  secret: env.KANTSUSHA_AUTH_SECRET,
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
});
