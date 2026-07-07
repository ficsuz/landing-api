import { Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { PrismaService } from '@common/services/prisma/prisma.service';
import { TransactionClient } from '@common/types/transaction.types';
import { USER_BLOCK_TIME_FOR_AUTH, expireTime, randomNumber, randomString } from '@common/utils';

@Injectable()
export class OneTimeCodeService {
  constructor(private readonly prisma: PrismaService) {}

  async generate(
    { email, userId, otp }: { email: string; userId: string; otp?: number | string },
    trx: TransactionClient = this.prisma,
  ) {
    if (!otp) {
      otp = randomNumber();
    }

    const otpPlain = otp.toString();
    const otpHash = createHash('sha256').update(otpPlain).digest('hex');

    const record = await trx.oneTimeCodes.create({
      data: {
        email,
        userId,
        otpHash,
        code: randomString(64).toString(),
        expiresAt: expireTime(USER_BLOCK_TIME_FOR_AUTH),
      },
    });

    // Return the plaintext OTP to the caller so it can be emailed / cached.
    return { ...record, otp: otpPlain };
  }

  async getNotExpiredOtpCode(
    userId: string,
  ): Promise<{ code: string; secondsRemaining: number } | null> {
    const otp = await this.prisma.oneTimeCodes.findFirst({
      where: {
        userId,
        consumedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
      select: {
        code: true,
        expiresAt: true,
      },
    });

    if (!otp) return null;

    const now = new Date();
    const secondsRemaining = Math.floor((otp.expiresAt.getTime() - now.getTime()) / 1000);

    return {
      code: otp.code,
      secondsRemaining,
    };
  }
}
