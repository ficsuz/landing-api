import { ApiProperty } from '@nestjs/swagger';
import { MemberType } from '@prisma/client';
import { TranslationDto } from '@common/dto/translation.dto';

export class MemberResponseDto {
  @ApiProperty({ example: '018f1a2b-3c4d-7e5f-8a9b-0c1d2e3f4a5b', description: 'Member ID' })
  id: string;

  @ApiProperty({ type: TranslationDto, description: 'Trilingual company name' })
  name: TranslationDto;

  @ApiProperty({
    type: TranslationDto,
    description: 'Trilingual company description',
    nullable: true,
  })
  description: TranslationDto | null;

  @ApiProperty({
    example: '018f1a2b-3c4d-7e5f-8a9b-0c1d2e3f4a5b',
    description: 'Logo file id (fetch via GET /files/:id)',
    nullable: true,
  })
  logoId: string | null;

  @ApiProperty({
    example: 'https://acwapower.com',
    description: 'External website URL',
    nullable: true,
  })
  link: string | null;

  @ApiProperty({
    enum: MemberType,
    example: MemberType.FULL,
    description: 'Membership category (EXECUTIVE_BOARD, FULL, or OBSERVER)',
  })
  type: MemberType;

  @ApiProperty({ example: 0, description: 'Display order (ascending)' })
  order: number;

  @ApiProperty({ example: true, description: 'Published flag' })
  status: boolean;

  @ApiProperty({ example: '2026-06-16T12:00:00.000Z', description: 'Creation timestamp' })
  createdAt: Date;
}
