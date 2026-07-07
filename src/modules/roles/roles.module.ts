import { Global, Module } from '@nestjs/common';
import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';
import { PrismaModule } from '@common/services/prisma/prisma.module';

@Global()
@Module({
  imports: [PrismaModule],
  controllers: [RolesController],
  providers: [RolesService],
  exports: [RolesService],
})
export class RolesModule {}
