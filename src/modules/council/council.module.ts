import { Module } from '@nestjs/common';

import { CouncilController } from './council.controller';
import { CouncilService } from './council.service';
import { PrismaModule } from '@common/services/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CouncilController],
  providers: [CouncilService],
  exports: [CouncilService],
})
export class CouncilModule {}
