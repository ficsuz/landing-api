import { Logger, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { I18nMiddleware, I18nValidationPipe } from 'nestjs-i18n';
import { AppModule } from './app.module';
import { TransformInterceptor } from '@common/interceptors/transform.interceptor';
import { setupSwagger } from '@common/config/swagger.config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { EnvService } from '@common/services/env/env.service';
import { RedisIoAdapter } from '@common/services/socket-gateway/adapter/socket.adapter';
import { join } from 'path';
import { networkInterfaces } from 'os';

// Collect every non-internal IPv4 address with its interface name so the startup
// log can show a URL reachable from other devices on the same network. A machine
// usually has several (Wi-Fi, Ethernet, VPN/Tailscale tunnels), so physical
// Wi-Fi/Ethernet interfaces are ranked first and the rest are listed too — that
// way the correct address is always visible even if the primary guess is wrong.
function getLanInterfaces(): Array<{ name: string; address: string }> {
  const found: Array<{ name: string; address: string }> = [];
  for (const [name, addresses] of Object.entries(networkInterfaces())) {
    for (const net of addresses ?? []) {
      if (net.family === 'IPv4' && !net.internal) {
        found.push({ name, address: net.address });
      }
    }
  }

  const rank = (name: string): number => {
    if (/^(en|eth|wl)/i.test(name)) return 0; // physical Wi-Fi / Ethernet
    if (/^(utun|tun|tap|bridge|docker|veth|vmnet|awdl|llw)/i.test(name)) return 2; // virtual / VPN
    return 1;
  };

  return found.sort((a, b) => rank(a.name) - rank(b.name) || a.name.localeCompare(b.name));
}

// Pretty, colored startup banner. Colors are disabled automatically when stdout
// is not a TTY (e.g. piped to a file or CI) so the output stays clean there.
function printStartupBanner(options: {
  appName: string;
  environment: string;
  port: number | string;
  localUrl: string;
  swaggerPath: string;
  interfaces: Array<{ name: string; address: string }>;
}): void {
  const { appName, environment, port, localUrl, swaggerPath, interfaces } = options;

  const color = process.stdout.isTTY === true;
  const paint = (code: string, text: string): string =>
    color ? `\x1b[${code}m${text}\x1b[0m` : text;
  const bold = (t: string): string => paint('1', t);
  const dim = (t: string): string => paint('2', t);
  const cyan = (t: string): string => paint('36', t);
  const green = (t: string): string => paint('32', t);
  const yellow = (t: string): string => paint('33', t);

  const ws = (url: string): string => url.replace(/^http/, 'ws');
  const rule = dim('─'.repeat(56));

  const row = (label: string, value: string): string => `   ${dim(label.padEnd(9))} ${cyan(value)}`;

  // Only fold the network URL inline when there is exactly one candidate — then
  // it is unambiguous. With several interfaces (Wi-Fi + Ethernet + VPN…) we must
  // not guess, so the blocks stay local-only and every address is listed below.
  const soleIp = interfaces.length === 1 ? interfaces[0].address : undefined;
  const netUrl = soleIp ? `http://${soleIp}:${port}` : undefined;

  const block = (icon: string, title: string, local: string, network?: string): string[] => {
    const lines = [`  ${icon}  ${bold(title)}`, row('Local', local)];
    if (network) lines.push(row('Network', network));
    return lines;
  };

  const lines: string[] = [
    '',
    `  ${green('●')} ${bold(appName)}  ${dim('·')}  ${yellow(environment)}  ${dim('·')}  ${dim('port')} ${bold(String(port))}`,
    `  ${rule}`,
    ...block('🌐', 'App', localUrl, netUrl),
    ...block('🔌', 'WebSocket', ws(localUrl), netUrl && ws(netUrl)),
    ...block('📚', 'API Docs', `${localUrl}/${swaggerPath}`, netUrl && `${netUrl}/${swaggerPath}`),
    `  ${rule}`,
  ];

  if (interfaces.length >= 2) {
    // Multiple interfaces — list them all so the user can pick the Wi-Fi one.
    lines.push(
      `  📶  ${bold('Network access')} ${dim('(same Wi-Fi) — pick the one matching your network')}`,
    );
    for (const { name, address } of interfaces) {
      lines.push(row(name, `http://${address}:${port}`));
    }
    lines.push(
      `  ${dim(`WebSocket → ws://<ip>:${port}   ·   API Docs → http://<ip>:${port}/${swaggerPath}`)}`,
    );
    lines.push(`  ${rule}`);
  } else if (interfaces.length === 0) {
    lines.push(`  ${dim('No external network interface detected — are you offline?')}`);
    lines.push(`  ${rule}`);
  } else {
    lines.push(`  ${dim('Tip: open the Network URL on devices connected to the same Wi-Fi.')}`);
  }
  lines.push('');

  console.log(lines.join('\n'));
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const env = app.get(EnvService);

  // Wire the Redis-backed WebSocket adapter so socket.io can scale across
  // instances. Fall back to the default in-memory adapter if Redis is down so
  // the app still boots.
  const redisIoAdapter = new RedisIoAdapter(app);
  try {
    await redisIoAdapter.connectToRedis({
      host: env.get('REDIS_HOST'),
      port: Number(env.get('REDIS_PORT')),
      password: env.get('REDIS_PASSWORD'),
      db: env.isProduction ? 1 : 0,
    });
    app.useWebSocketAdapter(redisIoAdapter);
  } catch (e) {
    new Logger('bootstrap').warn(
      `Redis WebSocket adapter unavailable, using default in-memory adapter: ${e}`,
    );
  }

  // Serve static files from public directory
  app.useStaticAssets(join(__dirname, '..', 'public'));

  // Resolve the request language (?lang / x-lang / Accept-Language) early so it
  // is available to pipes, handlers and the global exception filter.
  app.use(I18nMiddleware);

  // Enable API versioning
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
    prefix: 'api/v',
  });

  // Global validation pipe — i18n-aware: validation errors are translated using
  // the keys passed via i18nValidationMessage() in DTOs.
  app.useGlobalPipes(
    new I18nValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global transform interceptor (the global exception filter is registered via
  // APP_FILTER in AppModule so it can inject I18nService + LoggerService).
  app.useGlobalInterceptors(new TransformInterceptor());

  // Enable CORS
  app.enableCors({
    origin: env.get('CORS_ORIGIN'),
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // Setup Swagger
  const swagger = setupSwagger(app);

  await app.listen(env.get('PORT'));

  // Pretty startup banner with both local and same-WiFi network URLs.
  const port = env.get('PORT');
  printStartupBanner({
    appName: 'nest-starter-template',
    environment: env.isProduction ? 'production' : 'development',
    port,
    localUrl: `http://localhost:${port}`,
    swaggerPath: swagger.swaggerPath,
    interfaces: getLanInterfaces(),
  });
}
bootstrap();
