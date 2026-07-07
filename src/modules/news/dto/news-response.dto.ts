import { ApiProperty } from '@nestjs/swagger';
import { TranslationDto } from '@common/dto/translation.dto';

export class NewsResponseDto {
  @ApiProperty({ example: '018f1a2b-3c4d-7e5f-8a9b-0c1d2e3f4a5b', description: 'News ID' })
  id: string;

  @ApiProperty({ type: TranslationDto, description: 'News title (trilingual)' })
  title: TranslationDto;

  @ApiProperty({ type: TranslationDto, description: 'News content (trilingual)', nullable: true })
  content: TranslationDto | null;

  @ApiProperty({
    example: '018f1a2b-3c4d-7e5f-8a9b-0c1d2e3f4a5b',
    description: 'Image file id (fetch via GET /files/:id)',
    nullable: true,
  })
  imageId: string | null;

  @ApiProperty({
    example: '2026-01-05T00:00:00.000Z',
    description: 'Publication date',
    nullable: true,
  })
  date: Date | null;

  @ApiProperty({ example: 1, description: 'Publication status (0 = draft, 1 = published)' })
  status: number;

  @ApiProperty({
    example: 'https://www.linkedin.com/posts/example',
    description: 'External link (e.g. LinkedIn post)',
    nullable: true,
  })
  otherLink: string | null;

  @ApiProperty({ example: '2026-06-16T12:00:00.000Z', description: 'Creation timestamp' })
  createdAt: Date;
}
