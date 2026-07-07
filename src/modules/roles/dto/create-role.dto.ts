import { ApiProperty } from '@nestjs/swagger';
import { uuid } from '@common/utils';
import { IsArray, IsOptional, IsString } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class CreateRoleDto {
  @ApiProperty({
    description: 'The name of the role',
    example: 'teacher',
  })
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  name: string;

  @ApiProperty({
    description: 'Description of the role',
    example: 'Teacher with course management access',
    required: false,
  })
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Array of permission IDs to assign to the role',
    example: [uuid(), uuid()],
    required: false,
    type: [String],
  })
  @IsArray({ message: i18nValidationMessage('validation.IS_ARRAY') })
  @IsOptional()
  @IsString({ each: true, message: i18nValidationMessage('validation.IS_STRING') })
  permissions?: string[];
}
