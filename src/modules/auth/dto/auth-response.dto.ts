import { ApiProperty } from '@nestjs/swagger';

export class AuthUserResponseDto {
  @ApiProperty({ example: '018f6c1e-1b2a-7c3d-9e4f-0a1b2c3d4e5f', description: 'User id' })
  id: string;

  @ApiProperty({ example: 'John Doe', description: 'User full name', nullable: true })
  fullName: string | null;

  @ApiProperty({ example: 'user@example.com', description: 'User email address' })
  email: string;

  @ApiProperty({ example: true, description: 'Whether the user has verified their email' })
  isVerified: boolean;

  @ApiProperty({ example: 'local', description: 'Authentication method (local, google, ...)' })
  authMethod: string;

  @ApiProperty({ example: 'local', description: 'Identity provider (local, google, ...)' })
  provider: string;
}

export class AuthTokensResponseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT access token',
  })
  accessToken: string;

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT refresh token',
  })
  refreshToken: string;

  @ApiProperty({ type: AuthUserResponseDto, description: 'Authenticated user profile' })
  user: AuthUserResponseDto;
}

export class OtpSentResponseDto {
  @ApiProperty({ example: 'a1b2c3d4', description: 'Opaque code identifying the issued OTP' })
  code: string;

  @ApiProperty({
    example: 'otp_send',
    description: 'Status of the OTP operation (otp_send, otp_resend, reset_code_sent, ...)',
  })
  status: string;

  @ApiProperty({ example: 'us****@example.com', description: 'Masked email the OTP was sent to' })
  email: string;

  @ApiProperty({ example: 120, description: 'Seconds until the OTP expires' })
  seconds: number;

  @ApiProperty({
    example: 'Reset code sent to your email',
    description: 'Optional human-readable message',
    required: false,
  })
  message?: string;
}

export class MessageResponseDto {
  @ApiProperty({
    example: 'password_reset_successful',
    description: 'Machine-readable status of the operation',
  })
  status: string;

  @ApiProperty({
    example: 'Password has been reset successfully.',
    description: 'Human-readable message',
  })
  message: string;

  @ApiProperty({
    example: 'us****@example.com',
    description: 'Masked email related to the operation',
    required: false,
  })
  email?: string;
}
