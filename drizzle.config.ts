import { defineConfig } from 'drizzle-kit';

const DATABASE_URL = process.env.KANTSUSHA_DATABASE_URL ?? './db/kantsusha.db';

export default defineConfig({
  schema: './src/lib/server/db/schema.ts',
  dialect: 'sqlite',
  dbCredentials: { url: DATABASE_URL },
  verbose: true,
  strict: true,
});
