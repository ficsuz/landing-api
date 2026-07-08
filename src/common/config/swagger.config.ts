import { ApiErrorResponseDto, ApiResponseDto } from '@common/interfaces/api-response.interface';
import { LANGUAGE_HEADER, LANGUAGE_SECURITY_SCHEME, SUPPORTED_LANGUAGES } from '@common/constants';
import { EnvService } from '@common/services/env/env.service';
import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as basicAuth from 'express-basic-auth';
import { injectGlobalSecurityScheme, injectStandardErrorResponses } from './swagger-responses';

export function setupSwagger(app: INestApplication) {
  const env = app.get(EnvService);
  const swaggerPath = 'api/docs';

  const options = new DocumentBuilder()
    .setTitle('API Documentation')
    .setDescription('REST API with authentication, RBAC, file storage, queues, and websockets.')
    .setVersion('1.0.0')
    // .addServer(`http://localhost:${env.get('PORT')}`, 'Development Server')
    .addBearerAuth(
      {
        description: 'Default JWT Authorization',
        type: 'http',
        in: 'header',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      'authorization',
    )
    .addTag(
      'Auth',
      'Authentication and authorization - Manage user authentication, login, logout, and token refresh',
    )
    .addTag('Users', 'User management - CRUD operations for user accounts and profiles')
    .addTag(
      'Roles',
      'User roles and permissions - Manage user roles, permissions, and access control',
    )
    .addTag(
      'Files',
      'File upload and management - Handle file uploads, downloads, and storage operations',
    )
    .addTag('Jobs', 'Background jobs - Create, monitor, and retry step-based job pipelines')
    // Expose the localization header in the "Authorize" dialog so it can be set
    // ONCE and sent on every request (better than a per-endpoint parameter). It
    // is modeled as an apiKey for the set-once UX — not a real credential.
    .addApiKey(
      {
        type: 'apiKey',
        name: LANGUAGE_HEADER,
        in: 'header',
        description: `Preferred response language — one of: ${SUPPORTED_LANGUAGES.join(', ')}. Overrides Accept-Language; falls back to the server default (${env.get('DEFAULT_LANGUAGE')}) when omitted.`,
      },
      LANGUAGE_SECURITY_SCHEME,
    )
    .build();

  // Protect Swagger with basic auth **in production only**.
  //
  // In development the docs are left open so they load like any other route —
  // notably from other devices on the same Wi-Fi (phone/tablet). Basic auth over
  // plain HTTP is unreliable on mobile browsers here: the mount also covers the
  // static UI assets (`/api/docs/swagger-ui-*.js`, `.css`, …), and a fresh device
  // often fetches them WITHOUT credentials, gets 401, and Swagger UI hangs on its
  // spinner forever (curl works only because `-u` forces creds on every request).
  // The `realm` keeps the prod credentials scoped to one stable protection space.
  if (env.isProduction) {
    app.use(
      [`/${swaggerPath}`, `/${swaggerPath}-json`],
      basicAuth({
        challenge: true,
        realm: 'Swagger Docs',
        users: {
          admin: 'admin',
        },
      }),
    );
  }

  const document = SwaggerModule.createDocument(app, options, {
    extraModels: [ApiResponseDto, ApiErrorResponseDto],
  });

  // Auto-document the standard error envelope on every operation so endpoints
  // never have to declare 401/403/404/422/500 by hand.
  injectStandardErrorResponses(document);

  // Then reference the language scheme from every operation so it's sent on all
  // requests once set in "Authorize" (must run AFTER the error injection above,
  // which keys 401/403 off whether an operation is secured).
  injectGlobalSecurityScheme(document, LANGUAGE_SECURITY_SCHEME);

  const customOptions = {
    customSiteTitle: 'Pattern API - Interactive Documentation',
    // customJsStr: defaultCustomJsStr,
    // Keep the chosen language (and bearer token) across page reloads.
    swaggerOptions: { persistAuthorization: true },
  };

  SwaggerModule.setup(swaggerPath, app, document, customOptions);

  return {
    swaggerPath,
  };
}
