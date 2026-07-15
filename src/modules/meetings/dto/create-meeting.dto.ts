import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsInt,
  IsOptional,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { TranslationDto } from '@common/dto/translation.dto';

export class CreateMeetingDto {
  @ApiProperty({ type: TranslationDto, description: 'Trilingual meeting title' })
  @ValidateNested()
  @Type(() => TranslationDto)
  title: TranslationDto;

  @ApiPropertyOptional({ type: TranslationDto, description: 'Trilingual meeting content' })
  @IsOptional()
  @ValidateNested()
  @Type(() => TranslationDto)
  content?: TranslationDto;

  @ApiPropertyOptional({ type: TranslationDto, description: 'Trilingual meeting subject/topic' })
  @IsOptional()
  @ValidateNested()
  @Type(() => TranslationDto)
  subject?: TranslationDto;

  @ApiPropertyOptional({
    example: '018f1a2b-3c4d-7e5f-8a9b-0c1d2e3f4a5b',
    description: 'Cover image file id (references Files.id; fetch via GET /files/:id)',
  })
  @IsUUID('all', { message: i18nValidationMessage('validation.IS_UUID') })
  @IsOptional()
  imageId?: string;

  @ApiPropertyOptional({
    type: [String],
    example: ['018f1a2b-3c4d-7e5f-8a9b-0c1d2e3f4a5b'],
    description:
      'Gallery image file ids (each references Files.id; fetch via GET /files/:id, ' +
      'download via GET /files/:id?download=true). Replaces the whole gallery when provided.',
  })
  @IsArray({ message: i18nValidationMessage('validation.IS_ARRAY') })
  @IsUUID('all', { each: true, message: i18nValidationMessage('validation.IS_UUID') })
  @IsOptional()
  imageIds?: string[];

  @ApiPropertyOptional({ example: '2026-01-05T00:00:00.000Z', description: 'Meeting date' })
  @IsDateString({}, { message: i18nValidationMessage('validation.IS_DATE_STRING') })
  @IsOptional()
  date?: string;

  @ApiPropertyOptional({
    example: 1,
    description: 'Publication status (0 = draft, 1 = published)',
    minimum: 0,
  })
  @Type(() => Number)
  @IsInt({ message: i18nValidationMessage('validation.IS_INT') })
  @Min(0, { message: i18nValidationMessage('validation.MIN') })
  @IsOptional()
  status?: number;
}
