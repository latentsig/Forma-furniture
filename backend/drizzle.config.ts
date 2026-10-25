import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema.ts',
  out: './drizzle',
  dbCredentials: { url: process.env.DATABASE_URL ?? 'postgres://forma:forma@127.0.0.1:5432/forma' },
  migrations: { schema: 'drizzle', table: '__drizzle_migrations' },
});
