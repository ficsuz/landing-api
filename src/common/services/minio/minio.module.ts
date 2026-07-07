import { Module } from '@nestjs/common';
import { MinioClientService } from './minio.service';
import { MinioModule } from 'nestjs-minio-client';
import { EnvService } from '@common/services/env/env.service';

@Module({
  imports: [
    MinioModule.registerAsync({
      inject: [EnvService],
      useFactory: (env: EnvService) => ({
        endPoint: env.get('MINIO_ENDPOINT'),
        port: Number(env.get('MINIO_PORT')),
        useSSL: env.get('MINIO_USE_SSL'),
        accessKey: env.get('MINIO_ACCESS_KEY'),
        secretKey: env.get('MINIO_SECRET_KEY'),
      }),
    }),
  ],
  providers: [MinioClientService],
  exports: [MinioClientService],
})
export class MinioClientModule {}
