import { ApiProperty } from '@nestjs/swagger';
import { TranslationDto } from '@common/dto/translation.dto';

export class DocumentCategoryResponseDto {
  @ApiProperty({ example: '018f1a2b-3c4d-7e5f-8a9b-0c1d2e3f4a5b', description: 'Category ID' })
  id: string;

  @ApiProperty({ type: TranslationDto, description: 'Category name (trilingual)' })
  name: TranslationDto;

  @ApiProperty({ example: 'annual-reports', description: 'Stable machine key (unique)' })
  slug: string;

  @ApiProperty({ example: 0, description: 'Tab display order (ascending)' })
  order: number;

  @ApiProperty({ example: true, description: 'Published flag (show the tab)' })
  status: boolean;

  @ApiProperty({ example: '2026-06-16T12:00:00.000Z', description: 'Creation timestamp' })
  createdAt: Date;
}
