import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { join } from 'path';
import { EnvService } from '@common/services/env/env.service';

@Module({
  imports: [
    MailerModule.forRootAsync({
      inject: [EnvService],
      useFactory: (env: EnvService) => ({
        transport: {
          host: env.get('MAIL_HOST'),
          port: Number(env.get('MAIL_PORT')),
          secure: Number(env.get('MAIL_PORT')) === 465,
          auth: {
            user: env.get('MAIL_USER'),
            pass: env.get('MAIL_PASS'),
          },
        },
        defaults: {
          from: `"App" <${env.get('MAIL_USER')}>`,
        },
        template: {
          dir: join(__dirname, 'templates'),
          adapter: new HandlebarsAdapter(),
          options: {
            strict: true,
          },
        },
      }),
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
