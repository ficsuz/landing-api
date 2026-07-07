import { ApiProperty } from '@nestjs/swagger';
import { TranslationDto } from '@common/dto/translation.dto';

export class ChronologyResponseDto {
  @ApiProperty({ example: '018f1a2b-3c4d-7e5f-8a9b-0c1d2e3f4a5b', description: 'Chronology ID' })
  id: string;

  @ApiProperty({ type: TranslationDto, description: 'Milestone label (trilingual)' })
  title: TranslationDto;

  @ApiProperty({
    type: TranslationDto,
    description: 'Milestone body/summary (trilingual)',
    nullable: true,
  })
  description: TranslationDto | null;

  @ApiProperty({
    example: '2024-05-03T00:00:00.000Z',
    description: 'Milestone date',
    nullable: true,
  })
  date: Date | null;

  @ApiProperty({ example: 0, description: 'Display order (ascending)' })
  order: number;

  @ApiProperty({ example: 1, description: 'Publication status (0 = draft, 1 = published)' })
  status: number;

  @ApiProperty({ example: '2026-06-16T12:00:00.000Z', description: 'Creation timestamp' })
  createdAt: Date;
}
