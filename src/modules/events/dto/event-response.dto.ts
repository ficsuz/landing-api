import { ApiProperty } from '@nestjs/swagger';
import { TranslationDto } from '@common/dto/translation.dto';

export class EventResponseDto {
  @ApiProperty({ example: '018f1a2b-3c4d-7e5f-8a9b-0c1d2e3f4a5b', description: 'Event ID' })
  id: string;

  @ApiProperty({ type: TranslationDto, description: 'Event title (trilingual)' })
  title: TranslationDto;

  @ApiProperty({ type: TranslationDto, description: 'Event content (trilingual)', nullable: true })
  content: TranslationDto | null;

  @ApiProperty({
    example: '018f1a2b-3c4d-7e5f-8a9b-0c1d2e3f4a5b',
    description: 'Preview image file id (fetch via GET /files/:id)',
    nullable: true,
  })
  previewImageId: string | null;

  @ApiProperty({
    example: '018f1a2b-3c4d-7e5f-8a9b-0c1d2e3f4a5b',
    description: 'Image file id (fetch via GET /files/:id)',
    nullable: true,
  })
  imageId: string | null;

  @ApiProperty({ example: '2026-06-17T00:00:00.000Z', description: 'Start date', nullable: true })
  startDate: Date | null;

  @ApiProperty({ example: '2026-06-24T00:00:00.000Z', description: 'End date', nullable: true })
  endDate: Date | null;

  @ApiProperty({ example: '2026-06-16T12:00:00.000Z', description: 'Creation timestamp' })
  createdAt: Date;
}
