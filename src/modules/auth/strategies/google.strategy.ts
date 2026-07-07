import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth2';
import { GoogleAuthService } from '../google.service';
import { IGoogleUser } from '../interfaces/google.interface';
import { EnvService } from '@common/services/env/env.service';
import { AppException } from '@common/exceptions/app.exception';
import { ErrorCodes } from '@common/constants/error-codes';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private readonly googleAuthService: GoogleAuthService,
    env: EnvService,
  ) {
    super({
      clientID: env.get('GOOGLE_CLIENT_ID'),
      clientSecret: env.get('GOOGLE_CLIENT_SECRET'),
      callbackURL: env.get('GOOGLE_CALLBACK_URL'),
      scope: ['profile', 'email'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: IGoogleUser,
    done: VerifyCallback,
  ): Promise<void> {
    try {
      // Validate profile data
      if (!profile?.id || !profile?.emails?.[0]?.value) {
        throw new AppException(ErrorCodes.INVALID_GOOGLE_PROFILE);
      }

      // Use the GoogleAuthService to handle OAuth callback
      const result = await this.googleAuthService.handleOAuthCallback(profile);

      // Return the result (tokens + user info)
      done(null, result);
    } catch (error) {
      console.error('Google OAuth validation error:', error.message);
      done(error, null);
    }
  }
}
