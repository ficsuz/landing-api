import { ApiProperty } from '@nestjs/swagger';
import { uuid } from '@common/utils';
import { IsArray, IsString } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class AssignRoleDto {
  @ApiProperty({
    description: 'The ID of the user to assign roles to',
    example: uuid(),
  })
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  userId: string;

  @ApiProperty({
    description: 'Array of role IDs to assign to the user',
    example: [uuid(), uuid()],
    type: [String],
  })
  @IsArray({ message: i18nValidationMessage('validation.IS_ARRAY') })
  @IsString({ each: true, message: i18nValidationMessage('validation.IS_STRING') })
  roleIds: string[];
}
