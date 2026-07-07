import { PrismaService } from '@common/services/prisma/prisma.service';

// Extract the transaction client type from the extended Prisma client
export type TransactionClient = Parameters<Parameters<PrismaService['$transaction']>[0]>[0];

// Alternative type that works with both regular Prisma and extended client
export type DatabaseClient = PrismaService | TransactionClient;
