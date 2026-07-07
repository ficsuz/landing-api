import { ApiProperty } from '@nestjs/swagger';
import { TranslationDto } from '@common/dto/translation.dto';

export class ReportResponseDto {
  @ApiProperty({ example: '018f1a2b-3c4d-7e5f-8a9b-0c1d2e3f4a5b', description: 'Report ID' })
  id: string;

  @ApiProperty({ type: TranslationDto, description: 'Report title (trilingual)' })
  title: TranslationDto;

  @ApiProperty({
    type: TranslationDto,
    description: 'Report summary (trilingual)',
    nullable: true,
  })
  description: TranslationDto | null;

  @ApiProperty({
    example: '018f1a2b-3c4d-7e5f-8a9b-0c1d2e3f4a5b',
    description: 'Cover image file id (fetch via GET /files/:id)',
    nullable: true,
  })
  previewImageId: string | null;

  @ApiProperty({
    example: '018f1a2b-3c4d-7e5f-8a9b-0c1d2e3f4a5b',
    description: 'Downloadable document file id (download via GET /files/:id?download=true)',
    nullable: true,
  })
  fileId: string | null;

  @ApiProperty({
    example: '2026-06-15T00:00:00.000Z',
    description: 'Publication date',
    nullable: true,
  })
  date: Date | null;

  @ApiProperty({ example: 1, description: 'Publication status (0 = draft, 1 = published)' })
  status: number;

  @ApiProperty({ example: '2026-06-16T12:00:00.000Z', description: 'Creation timestamp' })
  createdAt: Date;
}
