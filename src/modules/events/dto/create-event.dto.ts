import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsOptional, IsUUID, ValidateNested } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { TranslationDto } from '@common/dto/translation.dto';

export class CreateEventDto {
  @ApiProperty({ type: TranslationDto, description: 'Trilingual event title' })
  @ValidateNested()
  @Type(() => TranslationDto)
  title: TranslationDto;

  @ApiPropertyOptional({
    type: TranslationDto,
    description: 'Trilingual event content (rich HTML)',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => TranslationDto)
  content?: TranslationDto;

  @ApiPropertyOptional({
    example: '018f1a2b-3c4d-7e5f-8a9b-0c1d2e3f4a5b',
    description: 'Preview image file id (references Files.id; fetch via GET /files/:id)',
  })
  @IsUUID('all', { message: i18nValidationMessage('validation.IS_UUID') })
  @IsOptional()
  previewImageId?: string;

  @ApiPropertyOptional({
    example: '018f1a2b-3c4d-7e5f-8a9b-0c1d2e3f4a5b',
    description: 'Image file id (references Files.id; fetch via GET /files/:id)',
  })
  @IsUUID('all', { message: i18nValidationMessage('validation.IS_UUID') })
  @IsOptional()
  imageId?: string;

  @ApiPropertyOptional({ example: '2026-06-17T00:00:00.000Z', description: 'Event start date' })
  @IsDateString({}, { message: i18nValidationMessage('validation.IS_DATE_STRING') })
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-06-24T00:00:00.000Z', description: 'Event end date' })
  @IsDateString({}, { message: i18nValidationMessage('validation.IS_DATE_STRING') })
  @IsOptional()
  endDate?: string;
}
