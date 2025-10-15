import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

if (!process.env.DATABASE_URL) {
  console.warn('DATABASE_URL is not set. Drizzle migrations may fail.');
}

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/schema.ts',
  out: './migrations',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL ?? ''
  }
});
