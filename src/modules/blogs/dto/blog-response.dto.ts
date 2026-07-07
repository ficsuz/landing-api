import { ApiProperty } from '@nestjs/swagger';
import { TranslationDto } from '@common/dto/translation.dto';

export class BlogResponseDto {
  @ApiProperty({ example: '018f1a2b-3c4d-7e5f-8a9b-0c1d2e3f4a5b', description: 'Blog ID' })
  id: string;

  @ApiProperty({ type: TranslationDto, description: 'Blog title (trilingual)' })
  title: TranslationDto;

  @ApiProperty({ type: TranslationDto, description: 'Blog content (trilingual)', nullable: true })
  content: TranslationDto | null;

  @ApiProperty({
    type: TranslationDto,
    description: 'Blog subject/topic (trilingual)',
    nullable: true,
  })
  subject: TranslationDto | null;

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

  @ApiProperty({ example: '2026-06-16T12:00:00.000Z', description: 'Creation timestamp' })
  createdAt: Date;
}
