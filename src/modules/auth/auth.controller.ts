import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  ApiOkData,
  ApiCreatedData,
  ApiMessageResponse,
  ApiErrorResponse,
} from '@common/decorators/api-response.decorator';
import {
  LoginDto,
  RefreshTokenDto,
  RegisterDto,
  ResendDto,
  VerifyOtpDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dto/auth.dto';
import {
  AuthTokensResponseDto,
  MessageResponseDto,
  OtpSentResponseDto,
} from './dto/auth-response.dto';
import { IUserSession } from './interfaces/auth.interface';
import { AuthService } from './auth.service';
import { User } from '@common/decorators/user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RESOURCES } from '@common/constants';
import { GoogleOAuthGuard } from '../../common/guards/google-oauth.guard';
import { IRequest } from '@common/interfaces/request.interface';
import { MailAuthService } from './mail.service';

@ApiTags('Auth')
@Controller({
  path: RESOURCES.AUTH,
  version: '1',
})
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly mailAuthService: MailAuthService,
  ) {}

  @Post('/register')
  @ApiOperation({
    summary: 'Register new user',
    description:
      'Creates (or re-uses) a pending user account and emails a one-time verification code.',
  })
  @ApiBody({ type: RegisterDto })
  @ApiCreatedData(OtpSentResponseDto, 'Verification code sent to the email')
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'User login',
    description: 'Authenticates user credentials and returns access and refresh tokens.',
  })
  @ApiBody({ type: LoginDto })
  @ApiOkData(AuthTokensResponseDto, 'Authentication tokens and profile')
  @ApiErrorResponse(401, 'Invalid email or password')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('/refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh tokens',
    description:
      'Exchanges a valid refresh token (in the body) for a new token pair. No access token required — this is what renews an expired access token.',
  })
  @ApiBody({ type: RefreshTokenDto })
  @ApiOkData(AuthTokensResponseDto, 'Newly issued authentication tokens')
  @ApiErrorResponse(401, 'Invalid or expired refresh token')
  refreshTokens(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshTokens(refreshTokenDto.refreshToken);
  }

  @Post('/logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('authorization')
  @ApiOperation({
    summary: 'Logout',
    description: 'Invalidates the current session and its refresh token.',
  })
  @ApiMessageResponse({ description: 'Session invalidated' })
  logout(@User() user: IUserSession) {
    return this.authService.logout(user.id, user);
  }

  @Post('/email/verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiBody({ type: VerifyOtpDto })
  @ApiOperation({
    summary: 'Verify email with OTP code',
    description: 'Verifies the emailed OTP, marks the user verified and returns tokens.',
  })
  @ApiOkData(AuthTokensResponseDto, 'Authentication tokens and profile')
  verify(@Body() payload: VerifyOtpDto) {
    return this.mailAuthService.verifyOtp(payload);
  }

  @Post('/email/resend-otp')
  @HttpCode(HttpStatus.OK)
  @ApiBody({ type: ResendDto })
  @ApiOperation({
    summary: 'Resend email OTP code',
    description: 'Re-issues a one-time verification code for the email tied to the given code.',
  })
  @ApiOkData(OtpSentResponseDto, 'Verification code re-sent')
  resend(@Body() payload: ResendDto) {
    return this.mailAuthService.resendOtp(payload);
  }

  @Post('/password/forgot')
  @HttpCode(HttpStatus.OK)
  @ApiBody({ type: ForgotPasswordDto })
  @ApiOperation({
    summary: 'Request password reset',
    description: 'Sends a password reset OTP code to the user email.',
  })
  @ApiOkData(OtpSentResponseDto, 'Password reset code sent')
  forgotPassword(@Body() payload: ForgotPasswordDto) {
    return this.authService.forgotPassword(payload.email);
  }

  @Post('/password/reset')
  @HttpCode(HttpStatus.OK)
  @ApiBody({ type: ResetPasswordDto })
  @ApiOperation({
    summary: 'Reset password',
    description: 'Resets the user password using a verified OTP code.',
  })
  @ApiOkData(MessageResponseDto, 'Password reset confirmation')
  resetPassword(@Body() payload: ResetPasswordDto) {
    return this.authService.resetPassword(payload.code, payload.otp, payload.newPassword);
  }

  @Get('/google')
  @UseGuards(GoogleOAuthGuard)
  @ApiOperation({
    summary: 'Google OAuth login',
    description: 'Initiates the Google OAuth authentication flow.',
  })
  @ApiMessageResponse({ description: 'Redirects to Google for authentication' })
  googleAuth() {
    return;
  }

  @Get('/google/callback')
  @UseGuards(GoogleOAuthGuard)
  @ApiOperation({
    summary: 'Google OAuth callback',
    description: 'Handles the Google OAuth callback and returns authentication tokens.',
  })
  @ApiOkData(AuthTokensResponseDto, 'Authentication tokens and profile')
  googleCallback(@Req() req: IRequest) {
    return req.user;
  }
}
