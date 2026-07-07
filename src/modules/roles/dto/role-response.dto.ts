import { ApiProperty } from '@nestjs/swagger';
import { uuid } from '@common/utils';

export class RoleResponseDto {
  @ApiProperty({
    description: 'The unique identifier of the role',
    example: uuid(),
  })
  id: string;

  @ApiProperty({
    description: 'The name of the role',
    example: 'teacher',
  })
  name: string;

  @ApiProperty({
    description: 'Description of the role',
    example: 'Teacher with course management access',
    required: false,
    nullable: true,
  })
  description?: string | null;

  @ApiProperty({
    description: 'Whether the role is a built-in system role',
    example: false,
  })
  isSystem: boolean;

  @ApiProperty({
    description: 'When the role was created',
    example: new Date().toISOString(),
  })
  createdAt: Date;
}
