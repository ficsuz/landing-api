import { Module } from '@nestjs/common';

import { SpecialProjectsController } from './special-projects.controller';
import { SpecialProjectsService } from './special-projects.service';
import { PrismaModule } from '@common/services/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SpecialProjectsController],
  providers: [SpecialProjectsService],
  exports: [SpecialProjectsService],
})
export class SpecialProjectsModule {}
