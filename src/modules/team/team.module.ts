import { Module } from '@nestjs/common';

import { TeamController } from './team.controller';
import { TeamService } from './team.service';
import { PrismaModule } from '@common/services/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TeamController],
  providers: [TeamService],
  exports: [TeamService],
})
export class TeamModule {}
