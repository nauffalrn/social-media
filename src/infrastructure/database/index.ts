import * as dotenv from 'dotenv';
dotenv.config();

import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import * as schema from './schema';
const postgres = require('postgres');

// Koneksi database
const connectionString = process.env.DATABASE_URL;
console.log('DATABASE_URL (index.ts):', connectionString);

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

// Tambahkan di main.ts atau index.ts
console.log('DATABASE_URL:', process.env.DATABASE_URL);
