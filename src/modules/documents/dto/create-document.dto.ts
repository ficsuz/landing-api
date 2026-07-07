import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
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

export class CreateDocumentDto {
  @ApiProperty({
    example: '018f1a2b-3c4d-7e5f-8a9b-0c1d2e3f4a5b',
    description: 'Category id (references DocumentCategories.id — the tab it belongs to)',
  })
  @IsUUID('all', { message: i18nValidationMessage('validation.IS_UUID') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.IS_NOT_EMPTY') })
  categoryId: string;

  @ApiProperty({ type: TranslationDto, description: 'Trilingual document title' })
  @ValidateNested()
  @Type(() => TranslationDto)
  @IsNotEmpty({ message: i18nValidationMessage('validation.IS_NOT_EMPTY') })
  title: TranslationDto;

  @ApiPropertyOptional({
    example: '018f1a2b-3c4d-7e5f-8a9b-0c1d2e3f4a5b',
    description:
      'Downloadable document file id (references Files.id; download via GET /files/:id?download=true)',
  })
  @IsUUID('all', { message: i18nValidationMessage('validation.IS_UUID') })
  @IsOptional()
  fileId?: string;

  @ApiPropertyOptional({ example: '2026-01-01T00:00:00.000Z', description: 'Document date' })
  @IsDateString({}, { message: i18nValidationMessage('validation.IS_DATE_STRING') })
  @IsOptional()
  date?: string;

  @ApiPropertyOptional({
    example: 0,
    description: 'Display order within a category (ascending)',
    minimum: 0,
  })
  @Type(() => Number)
  @IsInt({ message: i18nValidationMessage('validation.IS_INT') })
  @Min(0, { message: i18nValidationMessage('validation.MIN') })
  @IsOptional()
  order?: number;

  @ApiPropertyOptional({ example: true, description: 'Published flag' })
  @IsBoolean({ message: i18nValidationMessage('validation.IS_BOOLEAN') })
  @IsOptional()
  status?: boolean;
}
