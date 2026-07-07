import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ExpertType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { TranslationDto } from '@common/dto/translation.dto';

export class CreateExpertDto {
  @ApiPropertyOptional({
    enum: ExpertType,
    default: ExpertType.INTERNATIONAL,
    description: 'Expert feed: INTERNATIONAL (advisory group) or UZBEK',
  })
  @IsEnum(ExpertType, { message: i18nValidationMessage('validation.IS_ENUM') })
  @IsOptional()
  type?: ExpertType;

  @ApiProperty({ type: TranslationDto, description: 'Trilingual full name' })
  @ValidateNested()
  @Type(() => TranslationDto)
  @IsNotEmpty({ message: i18nValidationMessage('validation.IS_NOT_EMPTY') })
  fullName: TranslationDto;

  @ApiProperty({ type: TranslationDto, description: 'Trilingual position' })
  @ValidateNested()
  @Type(() => TranslationDto)
  @IsNotEmpty({ message: i18nValidationMessage('validation.IS_NOT_EMPTY') })
  position: TranslationDto;

  @ApiPropertyOptional({ type: TranslationDto, description: 'Trilingual biography / about' })
  @IsOptional()
  @ValidateNested()
  @Type(() => TranslationDto)
  bio?: TranslationDto;

  @ApiPropertyOptional({
    example: '018f1a2b-3c4d-7e5f-8a9b-0c1d2e3f4a5b',
    description: 'Image file id (references Files.id; fetch via GET /files/:id)',
  })
  @IsUUID('all', { message: i18nValidationMessage('validation.IS_UUID') })
  @IsOptional()
  imageId?: string;

  @ApiPropertyOptional({ example: 'expert@example.com', description: 'Contact email' })
  @IsEmail({}, { message: i18nValidationMessage('validation.IS_EMAIL') })
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: '+998901234567', description: 'Contact phone' })
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: 0, description: 'Display order (ascending)', minimum: 0 })
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
