import { defineConfig, env } from 'prisma/config';
import 'dotenv/config';

export default defineConfig({
  schema: './schema.prisma',
  migrations: {
    path: './migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
