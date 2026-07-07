import { UsersModule } from '@modules/users/users.module';
import { Module } from '@nestjs/common';
import { JwtModule, JwtSignOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { EnvService } from '@common/services/env/env.service';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AuthGuard } from '../../common/guards/auth.guard';
import { AuthController } from './auth.controller';
import { PrismaModule } from '@common/services/prisma/prisma.module';
import { GoogleAuthService } from './google.service';
import { MailAuthService } from './mail.service';
import { OneTimeCodeService } from './one-time-code.service';
import { RedisModule } from '@common/services/redis/redis.module';
import { MailModule } from '@common/services/mail/mail.module';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [EnvService],
      useFactory: (env: EnvService) => ({
        secret: env.get('JWT_ACCESS_TOKEN_SECRET'),
        signOptions: {
          expiresIn: env.get('JWT_ACCESS_TOKEN_EXPIRATION') as JwtSignOptions['expiresIn'],
        },
      }),
    }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    PrismaModule,
    UsersModule,
    RedisModule,
    MailModule,
  ],
  providers: [
    AuthService,
    JwtStrategy,
    JwtAuthGuard,
    AuthGuard,
    GoogleAuthService,
    OneTimeCodeService,
    MailAuthService,
  ],
  controllers: [AuthController],
  exports: [AuthService, GoogleAuthService, MailAuthService, OneTimeCodeService],
})
export class AuthModule {}
