import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

// Create a single PostgreSQL connection pool for the Prisma pg adapter.
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

/**
 * Base Prisma client wired to the pg adapter. PrismaService extends this so the
 * rest of the app depends on a single, DI-managed client instance.
 */
export class ExtendedPrismaClient extends PrismaClient {
  constructor() {
    super({
      adapter,
      log: ['error', 'warn'],
      errorFormat: 'minimal',
    });
  }
}
