import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsNotEmpty, IsOptional, Min, ValidateNested } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { TranslationDto } from '@common/dto/translation.dto';

export class CreateCouncilCalendarDto {
  @ApiProperty({
    type: TranslationDto,
    description: 'Trilingual session title (e.g. "I Plenary Session held")',
  })
  @ValidateNested()
  @Type(() => TranslationDto)
  @IsNotEmpty({ message: i18nValidationMessage('validation.IS_NOT_EMPTY') })
  title: TranslationDto;

  @ApiPropertyOptional({
    type: TranslationDto,
    description: 'Trilingual body shown on the "Learn more" detail',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => TranslationDto)
  description?: TranslationDto;

  @ApiPropertyOptional({
    example: '2022-11-01T00:00:00.000Z',
    description: 'Session date — the card renders its year and month from this',
  })
  @IsDateString({}, { message: i18nValidationMessage('validation.IS_DATE_STRING') })
  @IsOptional()
  date?: string;

  @ApiPropertyOptional({ example: 0, description: 'Display order (ascending)', minimum: 0 })
  @Type(() => Number)
  @IsInt({ message: i18nValidationMessage('validation.IS_INT') })
  @Min(0, { message: i18nValidationMessage('validation.MIN') })
  @IsOptional()
  order?: number;

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
