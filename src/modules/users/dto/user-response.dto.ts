import { ApiProperty } from '@nestjs/swagger';

export class UserRoleResponseDto {
  @ApiProperty({ example: '018f1a2b-3c4d-7e5f-8a9b-0c1d2e3f4a5b', description: 'Role ID' })
  id: string;

  @ApiProperty({ example: 'admin', description: 'Role name' })
  name: string;

  @ApiProperty({
    example: 'Administrator role',
    description: 'Role description',
    nullable: true,
  })
  description: string | null;
}

export class UserResponseDto {
  @ApiProperty({ example: '018f1a2b-3c4d-7e5f-8a9b-0c1d2e3f4a5b', description: 'User ID' })
  id: string;

  @ApiProperty({ example: 'user@example.com', description: 'User email address' })
  email: string;

  @ApiProperty({ example: 'John Doe', description: 'User full name' })
  fullName: string;

  @ApiProperty({ example: true, description: 'Whether the user has verified their account' })
  isVerified: boolean;

  @ApiProperty({ example: '2026-06-16T12:00:00.000Z', description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({
    type: [UserRoleResponseDto],
    description: 'Roles assigned to the user',
    required: false,
  })
  roles?: UserRoleResponseDto[];
}
