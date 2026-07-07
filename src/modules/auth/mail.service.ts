import { Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { PrismaService } from '@common/services/prisma/prisma.service';
import { RedisService } from '@common/services/redis/redis.service';
import {
  compareTwoDate,
  dateDiff,
  encodeEmail,
  expireTime,
  USER_BLOCK_TIME_FOR_AUTH,
} from '@common/utils';
import { REDIS_DURATION_2_MINS } from '@common/services/redis/durations';
import { Prisma, Users } from '@prisma/client';
import { OneTimeCodeService } from './one-time-code.service';
import { AuthService } from './auth.service';
import { AppException } from '@common/exceptions/app.exception';
import { ErrorCodes } from '@common/constants/error-codes';

@Injectable()
export class MailAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly oneTimeCodeService: OneTimeCodeService,
    private readonly redisService: RedisService,
    private readonly authService: AuthService,
  ) {}

  async verifyOtp({ code, otp }: { code: string; otp: string }) {
    const getGeneratedInCache = await this.redisService.get(code);

    if (!getGeneratedInCache) {
      throw new AppException(ErrorCodes.OTP_EXPIRED);
    }

    // Otp and code compare logic
    await this.checkOtp({ code, otp }, getGeneratedInCache);

    let { email }: { email: string } = getGeneratedInCache;
    email = email.toLocaleLowerCase();
    const user: Users = await this.prisma.users.findUnique({
      where: { email, isDeleted: false },
    });

    if (!user) {
      throw new AppException(ErrorCodes.USER_NOT_FOUND);
    }

    if (user.verificationAttempt > 2 && user.blockedAt && compareTwoDate(user.blockedAt)) {
      throw new AppException(ErrorCodes.TOO_MANY_ATTEMPTS, {
        args: { minutes: dateDiff(user.blockedAt) },
      });
    }

    try {
      return await this.prisma.$transaction(async (trx) => {
        const updateUser = await trx.users.update({
          where: { id: user.id },
          data: {
            isVerified: true,
            verificationAttempt: 0,
            blockedAt: null,
            lastLoginAt: new Date(),
          },
          select: {
            id: true,
            fullName: true,
            email: true,
            isVerified: true,
            authMethod: true,
            provider: true,
          },
        });

        // Mark the verified code as consumed and drop it from the cache.
        await trx.oneTimeCodes.updateMany({
          where: { code, consumedAt: null },
          data: { consumedAt: new Date() },
        });
        await this.redisService.del(code);

        const tokens = await this.authService.generateTokens(user, trx);

        return {
          ...tokens,
          user: {
            id: updateUser.id,
            fullName: updateUser.fullName,
            email: updateUser.email,
            isVerified: updateUser.isVerified,
            authMethod: updateUser.authMethod,
            provider: updateUser.provider,
          },
        };
      });
    } catch {
      throw new AppException(ErrorCodes.VERIFICATION_FAILED);
    }
  }

  async resendOtp({ code }: Record<'code', string>) {
    const getGeneratedInCache = await this.redisService.get(code);

    if (!getGeneratedInCache) {
      throw new AppException(ErrorCodes.OTP_EXPIRED);
    }

    let user: Users = await this.prisma.users.findUnique({
      where: { id: getGeneratedInCache.userId, isDeleted: false },
    });
    if (!user) {
      throw new AppException(ErrorCodes.USER_NOT_FOUND);
    }

    if (user.blockedAt && dateDiff(user.blockedAt) <= 0) {
      user = await this.setAttempt(user.id, 0);
    }

    if (user.verificationAttempt > 2 && user.blockedAt && compareTwoDate(user.blockedAt)) {
      throw new AppException(ErrorCodes.TOO_MANY_ATTEMPTS, {
        args: { minutes: dateDiff(user.blockedAt) },
      });
    }

    user.email = user.email.toLocaleLowerCase();

    const generated = await this.oneTimeCodeService.generate({
      email: user.email,
      userId: user.id,
    });

    if (!generated) {
      throw new AppException(ErrorCodes.OTP_GENERATION_FAILED);
    }

    const updatedUser = await this.setAttempt(user.id, +user.verificationAttempt + 1);

    await this.redisService.cache(generated.code, generated, REDIS_DURATION_2_MINS);
    await this.redisService.del(code);

    const data = {
      email: encodeEmail(user.email),
      verificationAttempt: updatedUser.verificationAttempt,
      seconds: 120,
      code: generated.code,
      status: 'otp_resend',
    };

    return data;
  }

  private async checkOtp(
    { code, otp }: { code: string; otp: string },
    data?: { otp: string; expiresAt: Date },
  ): Promise<void> {
    if (data) {
      // Cache hit: the cached object carries the plaintext OTP (cache is ephemeral).
      if (data.otp !== otp || !compareTwoDate(data.expiresAt)) {
        throw new AppException(ErrorCodes.OTP_INVALID);
      }
    } else {
      // DB fallback: the OTP is stored hashed at rest.
      const generated = await this.prisma.oneTimeCodes.findFirst({
        where: { code, consumedAt: null },
        select: { otpHash: true, expiresAt: true },
      });

      const submittedHash = createHash('sha256').update(otp).digest('hex');

      if (
        !generated ||
        generated.otpHash !== submittedHash ||
        !compareTwoDate(generated.expiresAt)
      ) {
        throw new AppException(ErrorCodes.OTP_INVALID);
      }
    }
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
}
