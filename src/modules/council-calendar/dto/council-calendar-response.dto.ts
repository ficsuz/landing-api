import { ApiProperty } from '@nestjs/swagger';
import { TranslationDto } from '@common/dto/translation.dto';

export class CouncilCalendarResponseDto {
  @ApiProperty({
    example: '018f1a2b-3c4d-7e5f-8a9b-0c1d2e3f4a5b',
    description: 'Council calendar entry ID',
  })
  id: string;

  @ApiProperty({ type: TranslationDto, description: 'Session title (trilingual)' })
  title: TranslationDto;

  @ApiProperty({
    type: TranslationDto,
    description: '"Learn more" body (trilingual)',
    nullable: true,
  })
  description: TranslationDto | null;

  @ApiProperty({
    example: '2022-11-01T00:00:00.000Z',
    description: 'Session date — the card renders its year and month from this',
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
