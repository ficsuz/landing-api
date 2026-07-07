import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { TranslationDto } from '@common/dto/translation.dto';

export class CreateDocumentCategoryDto {
  @ApiProperty({ type: TranslationDto, description: 'Trilingual category name (the tab label)' })
  @ValidateNested()
  @Type(() => TranslationDto)
  @IsNotEmpty({ message: i18nValidationMessage('validation.IS_NOT_EMPTY') })
  name: TranslationDto;

  @ApiProperty({
    example: 'annual-reports',
    description: 'Stable machine key for client-side routing (unique)',
  })
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.IS_NOT_EMPTY') })
  slug: string;

  @ApiPropertyOptional({ example: 0, description: 'Tab display order (ascending)', minimum: 0 })
  @Type(() => Number)
  @IsInt({ message: i18nValidationMessage('validation.IS_INT') })
  @Min(0, { message: i18nValidationMessage('validation.MIN') })
  @IsOptional()
  order?: number;

  @ApiPropertyOptional({ example: true, description: 'Published flag (show the tab)' })
  @IsBoolean({ message: i18nValidationMessage('validation.IS_BOOLEAN') })
  @IsOptional()
  status?: boolean;
}
