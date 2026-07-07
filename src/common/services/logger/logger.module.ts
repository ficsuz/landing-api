import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { LoggerService } from './logger.service';
import { EnvService } from '@common/services/env/env.service';

@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [EnvService],
      useFactory: (env: EnvService) => ({
        secret: env.get('JWT_ACCESS_TOKEN_SECRET'),
      }),
    }),
  ],
  providers: [LoggerService],
  exports: [LoggerService],
})
export class LoggerModule {}
