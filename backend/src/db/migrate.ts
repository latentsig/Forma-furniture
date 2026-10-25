import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { db, sql } from './connection.ts';

try {
  await migrate(db, { migrationsFolder: './drizzle' });
  process.stdout.write('Database migrations applied.\n');
} finally {
  await sql.end();
}
