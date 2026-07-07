import { ApiProperty } from '@nestjs/swagger';
import { IsDefined, IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class RegisterDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'User email address',
  })
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.IS_NOT_EMPTY') })
  @IsEmail({}, { message: i18nValidationMessage('validation.IS_EMAIL') })
  email: string;

  @ApiProperty({
    example: 'John',
    description: 'User first name',
  })
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.IS_NOT_EMPTY') })
  fullName: string;

  @ApiProperty({
    example: 'P@ssw0rd123',
    description: 'User password',
  })
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.IS_NOT_EMPTY') })
  password: string;
}

export class LoginDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'User email address',
  })
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.IS_NOT_EMPTY') })
  @IsEmail({}, { message: i18nValidationMessage('validation.IS_EMAIL') })
  email: string;

  @ApiProperty({
    example: 'P@ssw0rd123',
    description: 'User password',
  })
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.IS_NOT_EMPTY') })
  password: string;
}

export class RefreshTokenDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Refresh token',
  })
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.IS_NOT_EMPTY') })
  refreshToken: string;
}

export class VerifyOtpDto {
  @IsDefined({ message: i18nValidationMessage('validation.IS_DEFINED') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.IS_NOT_EMPTY') })
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  @ApiProperty({ default: '123456' })
  otp: string;

  @IsDefined({ message: i18nValidationMessage('validation.IS_DEFINED') })
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.IS_NOT_EMPTY') })
  @ApiProperty({ default: 'code' })
  code: string;
}

export class ResendDto {
  @IsDefined({ message: i18nValidationMessage('validation.IS_DEFINED') })
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.IS_NOT_EMPTY') })
  @ApiProperty({ default: 'code' })
  code: string;
}

export class ForgotPasswordDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'User email address to send reset code',
  })
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.IS_NOT_EMPTY') })
  @IsEmail({}, { message: i18nValidationMessage('validation.IS_EMAIL') })
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty({
    example: '123456',
    description: 'OTP code received via email',
  })
  @IsDefined({ message: i18nValidationMessage('validation.IS_DEFINED') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.IS_NOT_EMPTY') })
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  otp: string;

  @ApiProperty({
    example: 'reset_code_123',
    description: 'Reset code identifier',
  })
  @IsDefined({ message: i18nValidationMessage('validation.IS_DEFINED') })
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.IS_NOT_EMPTY') })
  code: string;

  @ApiProperty({
    example: 'newPassword123',
    description: 'New password for the user',
  })
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.IS_NOT_EMPTY') })
  newPassword: string;
}
