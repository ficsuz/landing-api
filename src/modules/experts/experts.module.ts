import { Module } from '@nestjs/common';

import { ExpertsController } from './experts.controller';
import { ExpertsService } from './experts.service';
import { PrismaModule } from '@common/services/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ExpertsController],
  providers: [ExpertsService],
  exports: [ExpertsService],
})
export class ExpertsModule {}
