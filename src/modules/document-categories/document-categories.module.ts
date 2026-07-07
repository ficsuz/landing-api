import { Module } from '@nestjs/common';

import { DocumentCategoriesController } from './document-categories.controller';
import { DocumentCategoriesService } from './document-categories.service';
import { PrismaModule } from '@common/services/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DocumentCategoriesController],
  providers: [DocumentCategoriesService],
  exports: [DocumentCategoriesService],
})
export class DocumentCategoriesModule {}
