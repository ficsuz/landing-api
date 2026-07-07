import { ErrorCodes } from '@common/constants/error-codes';
import { AppException } from '@common/exceptions/app.exception';
import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendOtpToVerifyEmail(email: string, otp_code: string): Promise<void> {
    const res = await this.mailerService.sendMail({
      to: email,
      subject: 'Verify Email',
      template: './otp-code',
      context: {
        otp_code,
      },
    });

    if (!res?.accepted?.length && !res?.messageId) {
      throw new AppException(ErrorCodes.INTERNAL_SERVER_ERROR);
    }
  }

  async sendOtpToVerifyPasswordReset(email: string, otp_code: string): Promise<void> {
    const res = await this.mailerService.sendMail({
      to: email,
      subject: 'Verify Email',
      template: './password-reset',
      context: {
        otp_code,
      },
    });

    if (!res?.accepted?.length && !res?.messageId) {
      throw new AppException(ErrorCodes.INTERNAL_SERVER_ERROR);
    }
  }
}
