import { ApiProperty } from '@nestjs/swagger';
import { uuid } from '@common/utils';

export class PermissionResponseDto {
  @ApiProperty({
    description: 'The unique identifier of the permission',
    example: uuid(),
  })
  id: string;

  @ApiProperty({
    description: 'The unique permission key in the form "<resource>:<action>"',
    example: 'user:create',
  })
  key: string;

  @ApiProperty({
    description: 'The resource the permission applies to',
    example: 'user',
  })
  resource: string;

  @ApiProperty({
    description: 'The action the permission grants',
    example: 'create',
  })
  action: string;

  @ApiProperty({
    description: 'Human-readable description of the permission',
    example: 'Allows creating users',
    required: false,
    nullable: true,
  })
  description?: string | null;
}
