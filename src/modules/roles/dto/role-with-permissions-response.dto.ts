import { ApiProperty } from '@nestjs/swagger';
import { PermissionResponseDto } from './permission-response.dto';
import { RoleResponseDto } from './role-response.dto';

export class RoleWithPermissionsResponseDto extends RoleResponseDto {
  @ApiProperty({
    description: 'The permissions granted by this role',
    type: [PermissionResponseDto],
  })
  permissions: PermissionResponseDto[];
}
