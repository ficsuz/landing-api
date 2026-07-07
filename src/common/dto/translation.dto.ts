import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

/**
 * A trilingual text value persisted as a single JSON column (`{ en, ru, uz }`).
 * Reused as both a request contract (nested + validated via
 * `@ValidateNested()` + `@Type(() => TranslationDto)`) and the Swagger response
 * shape for translatable fields. See {@link ITranslation}.
 */
export class TranslationDto {
  @ApiProperty({ example: 'Key Events of the Week' })
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.IS_NOT_EMPTY') })
  en: string;

  @ApiProperty({ example: 'Основные события недели' })
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.IS_NOT_EMPTY') })
  ru: string;

  @ApiProperty({ example: 'Haftaning asosiy voqealari' })
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.IS_NOT_EMPTY') })
  uz: string;
}
