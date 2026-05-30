import { drizzle } from 'drizzle-orm/bun-sqlite';
import { Database } from 'bun:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

import * as schema from './schema';

const DATABASE_URL = process.env.KANTSUSHA_DATABASE_URL ?? './db/kantsusha.db';
if (DATABASE_URL !== ':memory:') {
  const filePath = DATABASE_URL.startsWith('file:') ? DATABASE_URL.slice(5) : DATABASE_URL;
  mkdirSync(dirname(filePath), { recursive: true });
}

const sqlite = new Database(DATABASE_URL);

export const db = drizzle(sqlite, { schema });
