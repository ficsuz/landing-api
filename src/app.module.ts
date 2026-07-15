import { LoggerModule } from '@common/services/logger/logger.module';
import { AuthModule } from '@modules/auth/auth.module';
import { UsersModule } from '@modules/users/users.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { BullModule } from '@nestjs/bullmq';
import { AcceptLanguageResolver, HeaderResolver, I18nModule, QueryResolver } from 'nestjs-i18n';
import { join } from 'path';
import { HttpExceptionFilter } from '@common/filters/http-exception.filter';
import { LANGUAGE_HEADER } from '@common/constants';
import { PrismaModule } from './common/services/prisma/prisma.module';
import { FilesModule } from '@modules/files/files.module';
import { RolesModule } from '@modules/roles/roles.module';
import { JobsModule } from '@modules/jobs/jobs.module';
import { EventsModule } from '@modules/events/events.module';
import { NewsModule } from '@modules/news/news.module';
import { CouncilModule } from '@modules/council/council.module';
import { TestimonialsModule } from '@modules/testimonials/testimonials.module';
import { BlogsModule } from '@modules/blogs/blogs.module';
import { ExpertsModule } from '@modules/experts/experts.module';
import { ReportsModule } from '@modules/reports/reports.module';
import { DocumentsModule } from '@modules/documents/documents.module';
import { DocumentCategoriesModule } from '@modules/document-categories/document-categories.module';
import { ChronologyModule } from '@modules/chronology/chronology.module';
import { CouncilCalendarModule } from '@modules/council-calendar/council-calendar.module';
import { TeamModule } from '@modules/team/team.module';
import { MembersModule } from '@modules/members/members.module';
import { MeetingsModule } from '@modules/meetings/meetings.module';
import { SpecialProjectsModule } from '@modules/special-projects/special-projects.module';
import { GoogleStrategy } from '@modules/auth/strategies/google.strategy';
import { GatewayModule } from '@common/services/socket-gateway/gateway.module';
import { EnvModule } from './common/services/env/env.module';
import { EnvService } from './common/services/env/env.service';
import { validate } from './common/services/env/env.validator';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
    }),
    I18nModule.forRootAsync({
      useFactory: (env: EnvService) => ({
        fallbackLanguage: env.get('DEFAULT_LANGUAGE'),
        // i18n JSON is copied to dist next to this module (see nest-cli.json).
        loaderOptions: {
          path: join(__dirname, 'i18n'),
          watch: !env.isProduction,
        },
      }),
      // Language resolution order: ?lang=ru → x-lang header → Accept-Language.
      resolvers: [
        { use: QueryResolver, options: ['lang'] },
        new HeaderResolver([LANGUAGE_HEADER]),
        AcceptLanguageResolver,
      ],
      inject: [EnvService],
    }),
    BullModule.forRootAsync({
      inject: [EnvService],
      useFactory: (env: EnvService) => ({
        connection: {
          host: env.get('REDIS_HOST'),
          port: Number(env.get('REDIS_PORT')),
          password: env.get('REDIS_PASSWORD'),
        },
      }),
    }),
    GatewayModule,
    PrismaModule,
    LoggerModule,
    AuthModule,
    UsersModule,
    RolesModule,
    FilesModule,
    JobsModule,
    EventsModule,
    NewsModule,
    CouncilModule,
    TestimonialsModule,
    BlogsModule,
    ExpertsModule,
    ReportsModule,
    DocumentCategoriesModule,
    DocumentsModule,
    ChronologyModule,
    CouncilCalendarModule,
    TeamModule,
    MembersModule,
    MeetingsModule,
    SpecialProjectsModule,
    EnvModule,
  ],
  providers: [
    GoogleStrategy,
    AppService,
    // Global error handler — registered here (not in main.ts) so it can inject
    // I18nService + LoggerService to localize and log every error.
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
  ],
  controllers: [AppController],
})
export class AppModule {}
