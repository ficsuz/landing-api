import { Injectable } from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash } from 'node:crypto';
import { v4 as uuidv4 } from 'uuid';

import {
  ILoginDto,
  IRegisterDto,
  ITokenPayload,
  ITokens,
  IUserSession,
} from './interfaces/auth.interface';
import { IUser } from '@modules/users/interfaces/user.interface';
import { PrismaService } from '@common/services/prisma/prisma.service';
import { Prisma, Users } from '@prisma/client';
import { TransactionClient } from '@common/types/transaction.types';
import { OneTimeCodeService } from './one-time-code.service';
import {
  compareTwoDate,
  dateDiff,
  encodeEmail,
  expireTime,
  USER_BLOCK_TIME_FOR_AUTH,
} from '@common/utils';
import { REDIS_DURATION_2_MINS } from '@common/services/redis/durations';
import { MailService } from '@common/services/mail/mail.service';
import { RedisService } from '@common/services/redis/redis.service';
import { EnvService } from '@common/services/env/env.service';
import { AppException } from '@common/exceptions/app.exception';
import { ErrorCodes } from '@common/constants/error-codes';

// Refresh token / session lifetime — mirrors JWT_REFRESH_TOKEN_EXPIRATION (7d).
const REFRESH_SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

// Max number of concurrent active sessions kept per user (e.g. 3 devices).
const MAX_ACTIVE_SESSIONS = 3;

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly oneTimeCodeService: OneTimeCodeService,
    private readonly mailService: MailService,
    private readonly redisService: RedisService,
    private readonly env: EnvService,
  ) {}

  async register(registerDto: IRegisterDto) {
    const email = registerDto.email.toLowerCase();

    let user = await this.prisma.users.findFirst({
      where: { email, isDeleted: false },
    });

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    let getNotExpiredOtpCode: {
      code: string;
      secondsRemaining: number;
    } | null;

    if (user) {
      getNotExpiredOtpCode = await this.oneTimeCodeService.getNotExpiredOtpCode(user.id);
    }

    if (getNotExpiredOtpCode) {
      const data = {
        code: getNotExpiredOtpCode?.code,
        status: 'otp_send',
        email: encodeEmail(email),
        seconds: getNotExpiredOtpCode?.secondsRemaining,
      };
      return data;
    }

    if (user && user.blockedAt && dateDiff(user.blockedAt) <= 0) {
      user = await this.setAttempt(user.id, 0);
    }

    if (user && user.verificationAttempt > 2 && user.blockedAt && compareTwoDate(user.blockedAt)) {
      throw new AppException(ErrorCodes.TOO_MANY_ATTEMPTS, {
        args: { minutes: dateDiff(user.blockedAt) },
      });
    }

    return this.prisma.$transaction(async (trx) => {
      if (!user) {
        // Create user if not exists
        user = await trx.users.create({
          data: {
            email,
            fullName: registerDto.fullName,
            password: hashedPassword,
            authMethod: 'local',
            provider: 'local',
            isVerified: false,
          },
        });
      }

      // Increment verification attempt
      await trx.users.update({
        where: { id: user.id },
        data: { verificationAttempt: user.verificationAttempt + 1 },
      });

      // Generate OTP
      const otpData = await this.oneTimeCodeService.generate(
        {
          email,
          userId: user.id,
        },
        trx,
      );

      // Send OTP via email
      await this.mailService.sendOtpToVerifyEmail(email, otpData.otp);

      // Cache the OTP
      await this.redisService.cache(otpData.code, otpData, REDIS_DURATION_2_MINS);

      return {
        code: otpData.code,
        status: 'otp_send',
        email: encodeEmail(email),
        seconds: 120,
      };
    });
  }

  async login(loginDto: ILoginDto): Promise<ITokens> {
    const user = await this.prisma.users.findFirst({
      where: { email: loginDto.email, isDeleted: false },
    });

    if (!user) {
      throw new AppException(ErrorCodes.INVALID_CREDENTIALS);
    }

    // Check if user has a password (local auth users should have one)
    if (!user.password) {
      throw new AppException(ErrorCodes.GOOGLE_ONLY_ACCOUNT);
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);

    if (!isPasswordValid) {
      throw new AppException(ErrorCodes.INVALID_CREDENTIALS);
    }

    return this.prisma.$transaction(async (trx) => {
      // Update last login
      await trx.users.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });

      delete user.password;
      const tokens = await this.generateTokens(user, trx);
      return {
        ...tokens,
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          isVerified: user.isVerified,
          authMethod: user.authMethod,
          provider: user.provider,
        },
      };
    });
  }

  async refreshTokens(refreshToken: string): Promise<ITokens> {
    // Authenticated by the refresh token alone — this endpoint renews the
    // short-lived access token, so it must not require one.
    let payload: ITokenPayload;
    try {
      payload = await this.jwtService.verifyAsync<ITokenPayload>(refreshToken, {
        secret: this.env.get('JWT_REFRESH_TOKEN_SECRET'),
      });
    } catch {
      throw new AppException(ErrorCodes.REFRESH_TOKEN_INVALID);
    }

    const refreshTokenHash = createHash('sha256').update(refreshToken).digest('hex');

    // The refresh token lives on its session row; it must still be active.
    const session = await this.prisma.userSessions.findFirst({
      where: {
        sessionId: payload.sessionId,
        isActive: true,
        refreshTokenHash,
        expiresAt: { gt: new Date() },
      },
    });

    if (!session) {
      throw new AppException(ErrorCodes.REFRESH_TOKEN_INVALID);
    }

    // Derive the user from the verified token, reloaded for current state.
    const user = await this.prisma.users.findFirst({
      where: { id: payload.id, isDeleted: false },
    });

    if (!user) {
      throw new AppException(ErrorCodes.REFRESH_TOKEN_INVALID);
    }

    return this.prisma.$transaction(async (trx) => {
      // Rotate: revoke the old session, then issue a fresh pair.
      await trx.userSessions.update({
        where: { id: session.id },
        data: { isActive: false, revokedAt: new Date() },
      });

      const tokens = await this.generateTokens(user, trx);

      return {
        ...tokens,
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          isVerified: user.isVerified,
          authMethod: user.authMethod,
          provider: user.provider,
        },
      };
    });
  }

  async logout(_userId: string, user: IUserSession): Promise<null> {
    await this.prisma.userSessions.updateMany({
      where: { sessionId: user.sessionId, isActive: true },
      data: {
        isActive: false,
        revokedAt: new Date(),
      },
    });
    return null;
  }

  async validateSession(sessionId: string): Promise<boolean> {
    try {
      const session = await this.prisma.userSessions.findFirst({
        where: { sessionId, isActive: true, expiresAt: { gt: new Date() } },
      });

      return !!session;
    } catch {
      return false;
    }
  }

  async generateTokens(
    user: IUserSession | IUser | Users,
    trx: TransactionClient = this.prisma,
  ): Promise<ITokens> {
    const sessionId = uuidv4();
    delete user.password;
    const payload: ITokenPayload = {
      id: user.id,
      email: user.email,
      sessionId,
      isVerified: user.isVerified,
    };

    const { id: userId } = user;

    // Keep only the most recent active sessions for this user; revoke the rest.
    const activeSessions = await trx.userSessions.findMany({
      where: {
        userId,
        isActive: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: MAX_ACTIVE_SESSIONS - 1,
      select: { id: true },
    });

    const sessionIdsToKeep = activeSessions.map((session) => session.id);

    await trx.userSessions.updateMany({
      where: {
        userId,
        isActive: true,
        id: { notIn: sessionIdsToKeep },
      },
      data: {
        isActive: false,
        revokedAt: new Date(),
      },
    });

    // Generate access and refresh tokens
    const now = new Date();
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.env.get('JWT_ACCESS_TOKEN_SECRET'),
        expiresIn: this.env.get('JWT_ACCESS_TOKEN_EXPIRATION') as JwtSignOptions['expiresIn'],
      }),
      this.jwtService.signAsync(payload, {
        secret: this.env.get('JWT_REFRESH_TOKEN_SECRET'),
        expiresIn: this.env.get('JWT_REFRESH_TOKEN_EXPIRATION') as JwtSignOptions['expiresIn'],
      }),
    ]);

    // The refresh token now lives on the session row (stored hashed).
    const refreshTokenHash = createHash('sha256').update(refreshToken).digest('hex');

    await trx.userSessions.create({
      data: {
        userId,
        sessionId,
        refreshTokenHash,
        isActive: true,
        expiresAt: new Date(now.getTime() + REFRESH_SESSION_TTL_MS),
        lastActivityAt: now,
      },
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  setAttempt(id: string, attempt: number): Promise<Users> {
    const data: Prisma.UsersUpdateInput = { verificationAttempt: attempt, blockedAt: null };
    if (attempt >= 3) {
      data.blockedAt = expireTime(USER_BLOCK_TIME_FOR_AUTH);
    } else if (attempt <= 1) {
      data.blockedAt = null;
    }

    return this.prisma.users.update({
      where: { id, isDeleted: false },
      data,
    });
  }

  async forgotPassword(email: string) {
    const normalizedEmail = email.toLowerCase();

    // Find user by email
    let user = await this.prisma.users.findFirst({
      where: { email: normalizedEmail, isDeleted: false },
    });

    if (!user) {
      throw new AppException(ErrorCodes.USER_NOT_FOUND);
    }

    if (!user.isVerified) {
      throw new AppException(ErrorCodes.USER_NOT_VERIFIED);
    }

    // Check if user is blocked
    if (user.blockedAt && dateDiff(user.blockedAt) <= 0) {
      user = await this.setAttempt(user.id, 0);
    }

    if (user.verificationAttempt > 2 && user.blockedAt && compareTwoDate(user.blockedAt)) {
      throw new AppException(ErrorCodes.TOO_MANY_ATTEMPTS, {
        args: { minutes: dateDiff(user.blockedAt) },
      });
    }

    // Check for existing non-expired OTP
    const getNotExpiredOtpCode = await this.oneTimeCodeService.getNotExpiredOtpCode(user.id);

    if (getNotExpiredOtpCode) {
      return {
        code: getNotExpiredOtpCode.code,
        status: 'reset_code_sent',
        email: encodeEmail(normalizedEmail),
        seconds: getNotExpiredOtpCode.secondsRemaining,
        message: 'Reset code already sent to your email',
      };
    }

    return this.prisma.$transaction(async (trx) => {
      // Increment verification attempt
      await trx.users.update({
        where: { id: user.id },
        data: { verificationAttempt: user.verificationAttempt + 1 },
      });

      // Generate OTP for password reset
      const otpData = await this.oneTimeCodeService.generate(
        {
          email: normalizedEmail,
          userId: user.id,
        },
        trx,
      );

      // Send reset code via email
      await this.mailService.sendOtpToVerifyPasswordReset(normalizedEmail, otpData.otp);

      // Cache the OTP
      await this.redisService.cache(otpData.code, otpData, REDIS_DURATION_2_MINS);

      return {
        code: otpData.code,
        status: 'reset_code_sent',
        email: encodeEmail(normalizedEmail),
        seconds: 120,
        message: 'Password reset code sent to your email',
      };
    });
  }

  async resetPassword(code: string, otp: string, newPassword: string) {
    const getGeneratedInCache = await this.redisService.get(code);

    if (!getGeneratedInCache) {
      throw new AppException(ErrorCodes.RESET_CODE_INVALID);
    }

    // Verify OTP
    if (getGeneratedInCache.otp !== otp) {
      throw new AppException(ErrorCodes.RESET_CODE_INVALID);
    }

    // Check if OTP is expired
    if (!compareTwoDate(getGeneratedInCache.expiresAt)) {
      throw new AppException(ErrorCodes.RESET_CODE_EXPIRED);
    }

    const { email, userId } = getGeneratedInCache;
    const user = await this.prisma.users.findFirst({
      where: { email: email.toLowerCase(), isDeleted: false },
    });

    if (!user) {
      throw new AppException(ErrorCodes.USER_NOT_FOUND);
    }

    return this.prisma.$transaction(async (trx) => {
      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update user password and reset attempts
      await trx.users.update({
        where: { id: userId },
        data: {
          password: hashedPassword,
          verificationAttempt: 0,
          blockedAt: null,
        },
      });

      // Invalidate all existing sessions for security
      await trx.userSessions.updateMany({
        where: { userId, isActive: true },
        data: {
          isActive: false,
          revokedAt: new Date(),
        },
      });

      // Remove OTP from cache
      await this.redisService.del(code);

      // Mark the user's outstanding OTP codes as consumed
      await trx.oneTimeCodes.updateMany({
        where: { userId, consumedAt: null },
        data: { consumedAt: new Date() },
      });

      return {
        status: 'password_reset_successful',
        message: 'Password has been reset successfully. Please login with your new password.',
        email: encodeEmail(email),
      };
    });
  }
}
