import { ApiProperty } from '@nestjs/swagger';
import { TranslationDto } from '@common/dto/translation.dto';

export class TeamMemberResponseDto {
  @ApiProperty({ example: '018f1a2b-3c4d-7e5f-8a9b-0c1d2e3f4a5b', description: 'Team member ID' })
  id: string;

  @ApiProperty({ type: TranslationDto, description: 'Trilingual full name' })
  fullName: TranslationDto;

  @ApiProperty({ type: TranslationDto, description: 'Trilingual position/title' })
  position: TranslationDto;

  @ApiProperty({
    type: TranslationDto,
    description: 'Trilingual biography / "about"',
    nullable: true,
  })
  bio: TranslationDto | null;

  @ApiProperty({
    example: '018f1a2b-3c4d-7e5f-8a9b-0c1d2e3f4a5b',
    description: 'Photo file id (fetch via GET /files/:id)',
    nullable: true,
  })
  photoId: string | null;

  @ApiProperty({ example: 'head@fics.uz', description: 'Contact email', nullable: true })
  email: string | null;

  @ApiProperty({ example: '+998 88 099 88 88', description: 'Contact phone', nullable: true })
  phone: string | null;

  @ApiProperty({ example: 0, description: 'Display order (ascending)' })
  order: number;

  @ApiProperty({ example: true, description: 'Published flag' })
  status: boolean;

  @ApiProperty({ example: '2026-06-16T12:00:00.000Z', description: 'Creation timestamp' })
  createdAt: Date;
}
