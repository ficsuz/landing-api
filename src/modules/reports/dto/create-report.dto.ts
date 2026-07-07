import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { TranslationDto } from '@common/dto/translation.dto';

export class CreateReportDto {
  @ApiProperty({ type: TranslationDto, description: 'Trilingual report title' })
  @ValidateNested()
  @Type(() => TranslationDto)
  @IsNotEmpty({ message: i18nValidationMessage('validation.IS_NOT_EMPTY') })
  title: TranslationDto;

  @ApiPropertyOptional({ type: TranslationDto, description: 'Trilingual report summary' })
  @IsOptional()
  @ValidateNested()
  @Type(() => TranslationDto)
  description?: TranslationDto;

  @ApiPropertyOptional({
    example: '018f1a2b-3c4d-7e5f-8a9b-0c1d2e3f4a5b',
    description: 'Cover image file id (references Files.id; fetch via GET /files/:id)',
  })
  @IsUUID('all', { message: i18nValidationMessage('validation.IS_UUID') })
  @IsOptional()
  previewImageId?: string;

  @ApiPropertyOptional({
    example: '018f1a2b-3c4d-7e5f-8a9b-0c1d2e3f4a5b',
    description:
      'Downloadable document file id (references Files.id; download via GET /files/:id?download=true)',
  })
  @IsUUID('all', { message: i18nValidationMessage('validation.IS_UUID') })
  @IsOptional()
  fileId?: string;

  @ApiPropertyOptional({ example: '2026-06-15T00:00:00.000Z', description: 'Publication date' })
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
