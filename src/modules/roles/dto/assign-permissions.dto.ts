import { ApiProperty } from '@nestjs/swagger';
import { uuid } from '@common/utils';
import { IsArray, IsString } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class AssignPermissionsDto {
  @ApiProperty({
    description: 'The ID of the role to assign permissions to',
    example: uuid(),
  })
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  roleId: string;

  @ApiProperty({
    description: 'Array of permission IDs to assign to the role',
    example: [uuid(), uuid()],
    type: [String],
  })
  @IsArray({ message: i18nValidationMessage('validation.IS_ARRAY') })
  @IsString({ each: true, message: i18nValidationMessage('validation.IS_STRING') })
  permissionIds: string[];
}
