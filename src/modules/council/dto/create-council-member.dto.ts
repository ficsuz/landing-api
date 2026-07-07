import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsUUID, Min, ValidateNested } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { TranslationDto } from '@common/dto/translation.dto';

export class CreateCouncilMemberDto {
  @ApiProperty({ type: TranslationDto, description: 'Trilingual full name' })
  @ValidateNested()
  @Type(() => TranslationDto)
  fullName: TranslationDto;

  @ApiProperty({ type: TranslationDto, description: 'Trilingual position/title' })
  @ValidateNested()
  @Type(() => TranslationDto)
  position: TranslationDto;

  @ApiPropertyOptional({
    example: '018f1a2b-3c4d-7e5f-8a9b-0c1d2e3f4a5b',
    description: 'Photo file id (references Files.id; fetch via GET /files/:id)',
  })
  @IsUUID('all', { message: i18nValidationMessage('validation.IS_UUID') })
  @IsOptional()
  photoId?: string;

  @ApiPropertyOptional({ example: 0, description: 'Display order (ascending)', minimum: 0 })
  @Type(() => Number)
  @IsInt({ message: i18nValidationMessage('validation.IS_INT') })
  @Min(0, { message: i18nValidationMessage('validation.MIN') })
  @IsOptional()
  order?: number;
}
