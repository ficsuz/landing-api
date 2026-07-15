import { ApiProperty } from '@nestjs/swagger';
import { ExpertType } from '@prisma/client';
import { TranslationDto } from '@common/dto/translation.dto';

export class ExpertResponseDto {
  @ApiProperty({ example: '018f1a2b-3c4d-7e5f-8a9b-0c1d2e3f4a5b', description: 'Expert ID' })
  id: string;

  @ApiProperty({
    enum: ExpertType,
    example: ExpertType.INTERNATIONAL,
    description: 'Expert feed (INTERNATIONAL, UZBEK, or LOCAL)',
  })
  type: ExpertType;

  @ApiProperty({ type: TranslationDto, description: 'Trilingual full name' })
  fullName: TranslationDto;

  @ApiProperty({ type: TranslationDto, description: 'Trilingual position' })
  position: TranslationDto;

  @ApiProperty({
    type: TranslationDto,
    description: 'Trilingual biography / about',
    nullable: true,
  })
  bio: TranslationDto | null;

  @ApiProperty({
    example: '018f1a2b-3c4d-7e5f-8a9b-0c1d2e3f4a5b',
    description: 'Image file id (fetch via GET /files/:id)',
    nullable: true,
  })
  imageId: string | null;

  @ApiProperty({ example: 'expert@example.com', description: 'Contact email', nullable: true })
  email: string | null;

  @ApiProperty({ example: '+998901234567', description: 'Contact phone', nullable: true })
  phone: string | null;

  @ApiProperty({ example: 0, description: 'Display order (ascending)' })
  order: number;

  @ApiProperty({ example: true, description: 'Published flag' })
  status: boolean;

  @ApiProperty({ example: '2026-06-16T12:00:00.000Z', description: 'Creation timestamp' })
  createdAt: Date;
}
