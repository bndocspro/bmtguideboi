import { neon, Pool } from '@neondatabase/serverless';
import { VALID_TABLE_NAMES } from './subjects';

if (!process.env.DATABASE_URL) {
  console.warn('DATABASE_URL is not set in environment variables.');
}

export const sql = neon(process.env.DATABASE_URL || '');

let _pool: Pool | null = null;
export function getPool(): Pool {
  if (!_pool) {
    _pool = new Pool({ connectionString: process.env.DATABASE_URL });
  }
  return _pool;
}

/**
 * Strictly validates that a dynamic subject table identifier belongs to our 25-table allowlist.
 * Prevents any SQL injection when querying subject-specific tables.
 */
export function assertValidTableName(tableName: string): string {
  if (!VALID_TABLE_NAMES.has(tableName)) {
    throw new Error(`Invalid subject table name: ${tableName}`);
  }
  return tableName;
}
