import { Module } from '@nestjs/common';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { PrismaModule } from '@common/services/prisma/prisma.module';
import { MinioClientModule } from '@common/services/minio/minio.module';

@Module({
  imports: [PrismaModule, MinioClientModule],
  controllers: [FilesController],
  providers: [FilesService],
  exports: [FilesService],
})
export class FilesModule {}
