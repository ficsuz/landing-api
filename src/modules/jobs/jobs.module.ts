import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from '@common/services/prisma/prisma.module';
import { MinioClientModule } from '@common/services/minio/minio.module';
import { GatewayModule } from '@common/services/socket-gateway/gateway.module';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';
import { JobsProcessor } from './jobs.processor';
import { StepRegistryService } from './step-registry.service';
import { WebsiteLoaderHandler } from './handlers/website-loader.handler';
import {
  JOB_QUEUE_NAME,
  STEP_BACKOFF_DELAY,
  STEP_HANDLERS,
  STEP_MAX_ATTEMPTS,
} from './jobs.constants';
import { IStepHandler } from './interfaces/step-handler.interface';

@Module({
  imports: [
    BullModule.registerQueue({
      // Redis connection is inherited from BullModule.forRoot() in AppModule.
      name: JOB_QUEUE_NAME,
      defaultJobOptions: {
        attempts: STEP_MAX_ATTEMPTS,
        backoff: { type: 'exponential', delay: STEP_BACKOFF_DELAY },
        // Cap retained jobs so Redis doesn't grow unbounded.
        removeOnComplete: 1000,
        removeOnFail: 5000,
      },
    }),
    PrismaModule,
    MinioClientModule,
    GatewayModule,
  ],
  controllers: [JobsController],
  providers: [
    JobsService,
    JobsProcessor,
    StepRegistryService,
    WebsiteLoaderHandler,
    // Collect every step handler under one token; StepRegistryService indexes
    // them by `handler.type`. To add a handler: implement IStepHandler, list the
    // class in `providers`, and add it to this factory's `inject` array.
    {
      provide: STEP_HANDLERS,
      useFactory: (...handlers: IStepHandler[]) => handlers,
      inject: [WebsiteLoaderHandler],
    },
  ],
  exports: [JobsService],
})
export class JobsModule {}
