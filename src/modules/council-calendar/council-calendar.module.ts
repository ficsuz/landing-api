import { Module } from '@nestjs/common';

import { CouncilCalendarController } from './council-calendar.controller';
import { CouncilCalendarService } from './council-calendar.service';
import { PrismaModule } from '@common/services/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CouncilCalendarController],
  providers: [CouncilCalendarService],
  exports: [CouncilCalendarService],
})
export class CouncilCalendarModule {}
