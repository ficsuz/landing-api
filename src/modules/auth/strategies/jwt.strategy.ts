import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from '../auth.service';
import { ITokenPayload } from '../interfaces/auth.interface';
import { EnvService } from '@common/services/env/env.service';
import { AppException } from '@common/exceptions/app.exception';
import { ErrorCodes } from '@common/constants/error-codes';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly authService: AuthService,
    env: EnvService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: env.get('JWT_ACCESS_TOKEN_SECRET'),
      passReqToCallback: false,
    });
  }

  async validate(payload: ITokenPayload) {
    try {
      if (!payload.sessionId) {
        throw new AppException(ErrorCodes.TOKEN_INVALID);
      }

      const isSessionValid = await this.authService.validateSession(payload.sessionId);

      if (!isSessionValid) {
        throw new AppException(ErrorCodes.SESSION_EXPIRED);
      }

      return {
        id: payload.id,
        email: payload.email,
        sessionId: payload.sessionId,
        isVerified: payload.isVerified,
      };
    } catch (error) {
      if (error instanceof AppException) {
        throw error;
      }
      throw new AppException(ErrorCodes.TOKEN_INVALID);
    }
  }
}
