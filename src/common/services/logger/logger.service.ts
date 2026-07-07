import { Injectable } from '@nestjs/common';
import * as winston from 'winston';
import { ElasticsearchTransport, LogData } from 'winston-elasticsearch';
import { Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { IRequest } from '@common/interfaces/request.interface';
import { EnvService } from '@common/services/env/env.service';

/** Render structured error `details` for the dev console (never throws). */
function formatDetails(details: unknown): string {
  try {
    return typeof details === 'string' ? details : JSON.stringify(details);
  } catch {
    return String(details);
  }
}

@Injectable()
export class LoggerService {
  private logger: winston.Logger;

  constructor(
    private readonly jwtService: JwtService,
    private readonly env: EnvService,
  ) {
    const nodeEnv = this.env.get('NODE_ENV');
    const isDevelopment = nodeEnv !== 'production';

    const transports: winston.transport[] = [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.timestamp(),
          winston.format.printf(({ timestamp, level, message, ...meta }) => {
            const userId = meta.userId || 'anonymous';
            const requestId = meta.requestId || '-';

            // Request + error context, when present (set by the exception filter
            // and request-scoped logs), rendered as: `METHOD /url → 404 CODE`.
            const http = meta.method && meta.url ? ` ${meta.method} ${meta.url}` : '';
            const status = meta.statusCode ? ` → ${meta.statusCode}` : '';
            const code = meta.code ? ` ${meta.code}` : '';

            let line = `[${timestamp}] ${level} [${userId}] [${requestId}]${http}${status}${code}: ${message}`;

            const err = meta.error as
              | { stack?: string; name?: string; message?: string; details?: unknown }
              | undefined;
            const details = meta.details ?? err?.details;

            // Locally, surface the structured details (e.g. the offending id) so
            // 4xx are debuggable too — the message alone is the localized text.
            if (isDevelopment && details !== undefined && details !== null) {
              line += `\n  details: ${formatDetails(details)}`;
            }
            // Always surface the underlying stack/cause for error-level logs so
            // 5xx stay debuggable in any environment.
            if (err && (err.stack || err.message)) {
              line += `\n${err.stack || `${err.name}: ${err.message}`}`;
            }
            return line;
          }),
        ),
      }),
    ];

    const esNode = this.env.get('ELASTICSEARCH_NODE');
    if (esNode) {
      const esTransportOpts = {
        level: 'info',
        clientOpts: {
          node: esNode,
          auth: {
            username: this.env.get('ELASTICSEARCH_USERNAME'),
            password: this.env.get('ELASTICSEARCH_PASSWORD'),
          },
        },
        indexPrefix: 'logs-app',
        dataStream: true,
        op_type: 'create',
        source: 'app-api',
        transformer: (
          logData: LogData & {
            error?: unknown;
            userId?: unknown;
            requestId?: unknown;
            correlationId?: unknown;
            method?: unknown;
            url?: unknown;
            userAgent?: unknown;
            ip?: unknown;
          },
        ) => {
          return {
            '@timestamp': new Date().toISOString(),
            severity: logData.level,
            fields: {
              ...logData.meta,
              environment: nodeEnv,
              service: 'app-api',
            },
            message: logData.message,
            error: logData.error,
            trace: {
              userId: logData.userId,
              requestId: logData.requestId,
              correlationId: logData.correlationId,
            },
            http: {
              method: logData.method,
              url: logData.url,
              userAgent: logData.userAgent,
              ip: logData.ip,
            },
          };
        },
      };

      transports.push(new ElasticsearchTransport(esTransportOpts));
    }

    this.logger = winston.createLogger({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
      ),
      defaultMeta: {
        service: 'logs-app',
        environment: nodeEnv,
      },
      transports,
    });
  }

  private extractRequestInfo(request?: IRequest) {
    if (!request) {
      return {
        userId: 'system',
        requestId: `req_${Date.now()}`,
        correlationId: `corr_${Date.now()}`,
      };
    }

    let userId = 'anonymous';

    // Try to get user_id from request.user first
    if (request.user?.id) {
      userId = request.user.id;
    }

    // If not found, try to parse from Authorization header
    else {
      try {
        const authHeader = request.headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer ')) {
          const token = authHeader.substring(7);

          const payload = this.jwtService.verify(token);

          if (payload && payload.sub) {
            userId = payload.sub;
          }
        }
      } catch {
        // Token parsing failed, keep userId as 'anonymous'
      }
    }

    return {
      userId,
      requestId: request.headers['x-request-id'] || `req_${Date.now()}`,
      correlationId: request.headers['x-correlation-id'] || `corr_${Date.now()}`,
      method: request.method,
      url: request.url,
      ip: request.ip,
      userAgent: request.get('user-agent'),
      params: request.params,
      query: request.query,
      body: this.sanitizeBody(request.body),
    };
  }

  private sanitizeBody(body: object) {
    if (!body) return null;
    const sanitized = { ...body };
    const sensitiveFields = ['password', 'token', 'secret', 'authorization'];
    sensitiveFields.forEach((field) => {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    });
    return sanitized;
  }

  private requestToCurl(request: Request): string {
    if (!request) return '';

    const method = request.method || 'GET';
    const fullUrl = `${request.protocol}://${request.get('host')}${request.originalUrl}`;
    const auth = request.headers.authorization || '';

    let curl = `curl -X ${method} '${fullUrl}'`;

    // Add authorization if exists
    if (auth) {
      curl += ` -H 'Authorization: ${auth}'`;
    }

    // Add content-type for POST/PUT requests
    curl += ` -H 'Content-Type: application/json'`;

    // Add body if exists
    if (request.body && Object.keys(request.body).length > 0) {
      const body = JSON.stringify(request.body).replace(/'/g, "'\\''");
      curl += ` -d '${body}'`;
    }

    return curl;
  }

  error(message: string, error: Error & { code?: number; details?: unknown }, request?: IRequest) {
    const requestInfo = this.extractRequestInfo(request);
    const errorInfo = {
      message,
      level: 'error',
      timestamp: new Date().toISOString(),
      ...requestInfo,
      error: {
        name: error?.name,
        message: error?.message,
        stack: error?.stack,
        code: error?.code,
        details: error?.details,
        type: error?.constructor?.name,
      },
      context: {
        functionName: (new Error().stack || '').split('\n')[2]?.trim(),
      },
      curlCommand: request ? this.requestToCurl(request) : undefined,
    };

    this.logger.error(errorInfo);
  }

  warn(message: string, meta?: object, request?: IRequest) {
    const requestInfo = this.extractRequestInfo(request);
    this.logger.warn({
      message,
      level: 'warn',
      timestamp: new Date().toISOString(),
      ...meta,
      ...requestInfo,
    });
  }

  info(message: string, meta?: object, request?: IRequest) {
    const requestInfo = this.extractRequestInfo(request);
    this.logger.info({
      message,
      level: 'info',
      timestamp: new Date().toISOString(),
      ...meta,
      ...requestInfo,
    });
  }

  debug(message: string, meta?: object, request?: IRequest) {
    const requestInfo = this.extractRequestInfo(request);
    this.logger.debug({
      message,
      level: 'debug',
      timestamp: new Date().toISOString(),
      ...meta,
      ...requestInfo,
    });
  }
}
