import { EnvService } from '@common/services/env/env.service';
import { PrismaService } from '@common/services/prisma/prisma.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly env: EnvService,
  ) {}

  /** Liveness/readiness probe used by the Docker healthcheck. */
  async getHealth() {
    let database = 'up';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      database = 'down';
    }

    return {
      status: database === 'up' ? 'ok' : 'degraded',
      environment: this.env.get('NODE_ENV'),
      database,
      timestamp: new Date().toISOString(),
    };
  }
}
