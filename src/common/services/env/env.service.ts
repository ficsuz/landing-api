import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsIn, IsNotEmpty, IsOptional, IsPort, IsString, IsUrl } from 'class-validator';
import { SUPPORTED_LANGUAGES, SupportedLanguage } from '@common/constants';

/**
 * Single, validated source of truth for environment configuration.
 *
 * Validation runs once at boot through `ConfigModule.forRoot({ validate })`
 * (see AppModule). Inject this service anywhere and read values with
 * `env.get('KEY')` — values are already typed/transformed (numbers, booleans).
 *
 * Do NOT read `process.env` directly elsewhere and do NOT reintroduce a second
 * env module — add new variables here so they are validated in one place.
 */
@Injectable()
export class EnvService {
  // ── Server ────────────────────────────────────────────────
  @IsOptional()
  @Type(() => Number)
  PORT: number = 5001;

  @IsIn(['development', 'production', 'test'])
  @IsNotEmpty()
  NODE_ENV: 'development' | 'production' | 'test' = 'development';

  @IsOptional()
  @IsString()
  CORS_ORIGIN: string = '*';

  // Fallback language for localized responses when the request resolves to a
  // locale that has no translation (see I18nModule in AppModule).
  @IsOptional()
  @IsIn(SUPPORTED_LANGUAGES)
  DEFAULT_LANGUAGE: SupportedLanguage = 'en';

  // ── Database ──────────────────────────────────────────────
  @IsNotEmpty()
  @IsString()
  DATABASE_URL: string;

  // ── JWT ───────────────────────────────────────────────────
  @IsNotEmpty()
  @IsString()
  JWT_ACCESS_TOKEN_SECRET: string;

  @IsNotEmpty()
  @IsString()
  JWT_REFRESH_TOKEN_SECRET: string;

  @IsNotEmpty()
  @IsString()
  JWT_ACCESS_TOKEN_EXPIRATION: string = '15m';

  @IsNotEmpty()
  @IsString()
  JWT_REFRESH_TOKEN_EXPIRATION: string = '7d';

  // ── Redis ─────────────────────────────────────────────────
  @IsNotEmpty()
  @IsString()
  REDIS_HOST: string;

  @IsNotEmpty()
  @IsPort()
  REDIS_PORT: string;

  @IsOptional()
  @IsString()
  REDIS_PASSWORD?: string;

  // ── Google OAuth ──────────────────────────────────────────
  @IsNotEmpty()
  @IsString()
  GOOGLE_CLIENT_ID: string;

  @IsNotEmpty()
  @IsString()
  GOOGLE_CLIENT_SECRET: string;

  @IsNotEmpty()
  @IsString()
  GOOGLE_CALLBACK_URL: string;

  // ── Mail ──────────────────────────────────────────────────
  @IsNotEmpty()
  @IsUrl({ require_tld: false })
  MAIL_HOST: string;

  @IsNotEmpty()
  @IsPort()
  MAIL_PORT: string;

  @IsNotEmpty()
  @IsString()
  MAIL_USER: string;

  @IsNotEmpty()
  @IsString()
  MAIL_PASS: string;

  // ── MinIO ─────────────────────────────────────────────────
  @IsNotEmpty()
  @IsString()
  MINIO_ENDPOINT: string;

  @IsNotEmpty()
  @IsPort()
  MINIO_PORT: string;

  @IsNotEmpty()
  @IsString()
  MINIO_ACCESS_KEY: string;

  @IsNotEmpty()
  @IsString()
  MINIO_SECRET_KEY: string;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  MINIO_USE_SSL: boolean = false;

  @IsOptional()
  @IsString()
  MINIO_BUCKET: string = 'uploads';

  // ── Swagger Basic Auth (docs are protected) ───────────────
  @IsOptional()
  @IsString()
  SWAGGER_USER: string = 'admin';

  @IsOptional()
  @IsString()
  SWAGGER_PASSWORD: string = 'admin';

  // ── Logging (Elasticsearch, optional) ─────────────────────
  @IsOptional()
  @IsString()
  ELASTICSEARCH_NODE?: string;

  @IsOptional()
  @IsString()
  ELASTICSEARCH_USERNAME?: string;

  @IsOptional()
  @IsString()
  ELASTICSEARCH_PASSWORD?: string;

  constructor(private readonly config: ConfigService) {}

  /** Read a validated, typed configuration value. */
  get<T extends keyof EnvService>(key: T): EnvService[T] {
    return this.config.get(key as string) as EnvService[T];
  }

  get isProduction(): boolean {
    return this.get('NODE_ENV') === 'production';
  }
}
