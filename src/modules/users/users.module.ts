import { LoggerModule } from '@common/services/logger/logger.module';
import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { PrismaModule } from '@common/services/prisma/prisma.module';

@Module({
  imports: [LoggerModule, PrismaModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
