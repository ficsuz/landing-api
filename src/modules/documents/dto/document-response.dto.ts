import { ApiProperty } from '@nestjs/swagger';
import { TranslationDto } from '@common/dto/translation.dto';
import { DocumentCategoryResponseDto } from '@modules/document-categories/dto/document-category-response.dto';

export class DocumentResponseDto {
  @ApiProperty({ example: '018f1a2b-3c4d-7e5f-8a9b-0c1d2e3f4a5b', description: 'Document ID' })
  id: string;

  @ApiProperty({
    example: '018f1a2b-3c4d-7e5f-8a9b-0c1d2e3f4a5b',
    description: 'Category id (the tab it belongs to)',
  })
  categoryId: string;

  @ApiProperty({
    type: DocumentCategoryResponseDto,
    description: 'The category (tab) this document belongs to',
  })
  category: DocumentCategoryResponseDto;

  @ApiProperty({ type: TranslationDto, description: 'Document title (trilingual)' })
  title: TranslationDto;

  @ApiProperty({
    example: '018f1a2b-3c4d-7e5f-8a9b-0c1d2e3f4a5b',
    description: 'Downloadable document file id (download via GET /files/:id?download=true)',
    nullable: true,
  })
  fileId: string | null;

  @ApiProperty({
    example: '2026-01-01T00:00:00.000Z',
    description: 'Document date',
    nullable: true,
  })
  date: Date | null;

  @ApiProperty({ example: 0, description: 'Display order within a category (ascending)' })
  order: number;

  @ApiProperty({ example: true, description: 'Published flag' })
  status: boolean;

  @ApiProperty({ example: '2026-06-16T12:00:00.000Z', description: 'Creation timestamp' })
  createdAt: Date;
}
