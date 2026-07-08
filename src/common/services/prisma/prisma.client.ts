import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

// Create a single PostgreSQL connection pool for the Prisma pg adapter.
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// The pool is deliberately tuned. With node-postgres defaults (idleTimeoutMillis
// 10s, connectionTimeoutMillis 0/unbounded, keepAlive off, no statement timeout)
// the pool drains after ~10s idle and the next request must cold-connect to the
// REMOTE Postgres; a single lost SYN then rides the ~20s kernel TCP retransmit
// backoff with nothing to abort it — the cause of the intermittent 10–20s request
// hangs and the ~19.8s first-request-after-idle. These options keep a warm,
// keep-alived floor of connections and put hard, sub-client-timeout bounds on both
// connecting and querying so a stall fails fast and frees its connection.
const pool = new Pool({
  connectionString,
  // Fail an acquire/connect in 5s instead of blocking ~20s on SYN-retransmit
  // (which would also block every pool waiter queued behind it).
  connectionTimeoutMillis: 5000,
  // Warm floor: once established, idle connections are not reaped below this, so
  // the common "first request after idle" no longer cold-connects. (pg-pool does
  // not pre-open them, so only the very first request after boot cold-connects.)
  min: 2,
  // Headroom for the 2–3 serial DB checkouts each authenticated request makes
  // plus the in-process BullMQ worker sharing this pool.
  max: 20,
  // Recycle genuinely idle connections after 30s (default 10s was too aggressive).
  idleTimeoutMillis: 30000,
  // TCP keepalive so half-open sockets silently dropped by the overlay/NAT are
  // detected and evicted before a query is dispatched onto them.
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
  // Bound any single in-flight query. Keep query_timeout (client-side backstop)
  // slightly above statement_timeout (server-side) so the server aborts first
  // with a clean 57014 + ReadyForQuery and the connection returns to the pool
  // healthy, instead of the client timer firing first and discarding a busy one.
  statement_timeout: 15000,
  query_timeout: 20000,
  // A long-lived server pool must never self-terminate when momentarily idle.
  allowExitOnIdle: false,
});
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
