import { createHash } from 'crypto';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool, PoolConfig } from 'pg';

import * as schema from './schema';

let pool: Pool | undefined;

export function getPool(config?: PoolConfig) {
  if (!pool) {
    const connectionString = config?.connectionString ?? process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL is required to initialize the database pool.');
    }
    pool = new Pool({ connectionString, ...config });
  }
  return pool;
}

export function getDb(config?: PoolConfig) {
  const currentPool = getPool(config);
  return drizzle(currentPool, { schema });
}

export function hashCustomerEmail(email: string, salt = process.env.CUSTOMER_HASH_SALT ?? '') {
  if (!email) return null;
  const normalized = email.trim().toLowerCase();
  const effectiveSalt = salt || process.env.CUSTOMER_HASH_SALT || 'luxury-heritage';
  return createHash('sha256').update(`${normalized}:${effectiveSalt}`).digest('hex');
}

export { schema };
