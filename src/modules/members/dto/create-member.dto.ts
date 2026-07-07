import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MemberType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsUrl,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { TranslationDto } from '@common/dto/translation.dto';

export class CreateMemberDto {
  @ApiProperty({ type: TranslationDto, description: 'Trilingual company name' })
  @ValidateNested()
  @Type(() => TranslationDto)
  @IsNotEmpty({ message: i18nValidationMessage('validation.IS_NOT_EMPTY') })
  name: TranslationDto;

  @ApiPropertyOptional({ type: TranslationDto, description: 'Trilingual company description' })
  @IsOptional()
  @ValidateNested()
  @Type(() => TranslationDto)
  description?: TranslationDto;

  @ApiPropertyOptional({
    example: '018f1a2b-3c4d-7e5f-8a9b-0c1d2e3f4a5b',
    description: 'Logo file id (references Files.id; fetch via GET /files/:id)',
  })
  @IsUUID('all', { message: i18nValidationMessage('validation.IS_UUID') })
  @IsOptional()
  logoId?: string;

  @ApiPropertyOptional({ example: 'https://acwapower.com', description: 'External website URL' })
  @IsUrl({}, { message: i18nValidationMessage('validation.IS_URL') })
  @IsOptional()
  link?: string;

  @ApiPropertyOptional({
    enum: MemberType,
    default: MemberType.FULL,
    description: 'Membership category: EXECUTIVE_BOARD, FULL, or OBSERVER',
  })
  @IsEnum(MemberType, { message: i18nValidationMessage('validation.IS_ENUM') })
  @IsOptional()
  type?: MemberType;

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
