import { ApiProperty } from '@nestjs/swagger';
import { TranslationDto } from '@common/dto/translation.dto';

export class CouncilMemberResponseDto {
  @ApiProperty({
    example: '018f1a2b-3c4d-7e5f-8a9b-0c1d2e3f4a5b',
    description: 'Council member ID',
  })
  id: string;

  @ApiProperty({ type: TranslationDto, description: 'Full name (trilingual)' })
  fullName: TranslationDto;

  @ApiProperty({ type: TranslationDto, description: 'Position/title (trilingual)' })
  position: TranslationDto;

  @ApiProperty({
    example: '018f1a2b-3c4d-7e5f-8a9b-0c1d2e3f4a5b',
    description: 'Photo file id (fetch via GET /files/:id)',
    nullable: true,
  })
  photoId: string | null;

  @ApiProperty({ example: 0, description: 'Display order (ascending)' })
  order: number;

  @ApiProperty({ example: '2026-06-16T12:00:00.000Z', description: 'Creation timestamp' })
  createdAt: Date;
}
