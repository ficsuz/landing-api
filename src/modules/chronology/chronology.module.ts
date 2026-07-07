import { Module } from '@nestjs/common';

import { ChronologyController } from './chronology.controller';
import { ChronologyService } from './chronology.service';
import { PrismaModule } from '@common/services/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ChronologyController],
  providers: [ChronologyService],
  exports: [ChronologyService],
})
export class ChronologyModule {}
