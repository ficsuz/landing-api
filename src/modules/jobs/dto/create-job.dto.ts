import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Prisma } from '@prisma/client';
import { ArrayNotEmpty, IsArray, IsObject, IsOptional, IsString } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { STEP_TYPES } from '../jobs.constants';

export class CreateJobDto {
  @ApiPropertyOptional({
    example: 'pipeline',
    description: 'Application-defined pipeline type (free-form label for the run)',
  })
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  @IsOptional()
  type?: string;

  @ApiProperty({
    type: [String],
    default: [STEP_TYPES.WEBSITE_LOADING],
    description: 'Ordered step types to run; each must resolve to a registered step handler',
  })
  @IsArray({ message: i18nValidationMessage('validation.IS_ARRAY') })
  @ArrayNotEmpty({ message: i18nValidationMessage('validation.ARRAY_NOT_EMPTY') })
  @IsString({ each: true, message: i18nValidationMessage('validation.IS_STRING') })
  steps: string[];

  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: true,
    description: 'Shared payload handed to every step handler in the run',
  })
  @IsObject({ message: i18nValidationMessage('validation.IS_OBJECT') })
  @IsOptional()
  data?: Prisma.InputJsonValue;
}
