import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ExtendedPrismaClient } from './prisma.client';

@Injectable()
export class PrismaService extends ExtendedPrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super();
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  cleanDatabase() {
    if (process.env.NODE_ENV === 'production') {
      return;
    }

    const models = Reflect.ownKeys(this).filter((key) => key[0] !== '_');

    return Promise.all(models.map((modelKey) => this[modelKey as string].deleteMany()));
  }
}
