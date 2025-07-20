import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import * as schema from './schema';

// Koneksi database
const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/social_media';

// Perbaiki cara penggunaan postgres
const client = postgres(connectionString);
export const db = drizzle(client, {
  schema: schema,
});

// Type untuk digunakan di service
export type DrizzleInstance = typeof db;

export async function runMigrations() {
  console.log('Running migrations...');

  const migrationClient = postgres(connectionString, { max: 1 });

  try {
    await migrate(drizzle(migrationClient), {
      migrationsFolder: 'drizzle/migrations',
    });
    console.log('✅ Migrations completed');
  } catch (err) {
    console.error('❌ Migration error:', err);
  } finally {
    await migrationClient.end();
  }
}
