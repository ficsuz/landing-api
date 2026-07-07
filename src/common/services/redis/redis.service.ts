import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { createClient, RedisClientType } from 'redis';
import { REDIS_DURATION_MONTH } from './durations';
import { EnvService } from '@common/services/env/env.service';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: RedisClientType;

  constructor(
    @Inject(CACHE_MANAGER) private readonly inMemoryCache: Cache,
    private readonly env: EnvService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.disconnect();
  }

  async connect(): Promise<void> {
    const host = this.env.get('REDIS_HOST');
    const port = Number(this.env.get('REDIS_PORT'));
    const password = this.env.get('REDIS_PASSWORD');

    this.client = createClient({
      socket: { host, port },
      password,
    });

    this.client.on('connect', () => {
      this.logger.log(`Redis - Connected to ${host}:${port}`);
    });

    this.client.on('error', (error) => {
      this.logger.warn(`Redis - Error ${error}`);
    });

    try {
      await this.client.connect();
      this.logger.log('Redis - Connection successful');
      this.logger.log(`Redis is running on: ${host}:${port}`);
    } catch (error) {
      this.logger.warn(`Redis - Client connection error ${error}`);
    }
  }

  async disconnect(): Promise<void> {
    if (this.client?.isOpen) {
      await this.client.quit();
      this.logger.log('Redis - Client disconnected');
    }
  }

  async get(key: string) {
    try {
      const data = await this.client.get(key);
      return this.outputFormat(data);
    } catch {
      this.logger.warn(`inMemory get called: ${key}`);
      const data = await this.inMemoryCache.get<string>(key);
      return this.outputFormat(data);
    }
  }

  async del(key: string) {
    try {
      await this.inMemoryCache.del(key);
      return await this.client.del(key);
    } catch {
      this.logger.warn(`inMemory del called: ${key}`);
      return this.inMemoryCache.del(key);
    }
  }

  async set(key: string, value: unknown, ttl = REDIS_DURATION_MONTH) {
    const formattedValue = this.inputFormat(value);
    try {
      return await this.client.set(key, formattedValue, { EX: Math.ceil(ttl / 1000) });
    } catch {
      this.logger.warn(`inMemory set called: ${key}`);
      return this.inMemoryCache.set(key, formattedValue, ttl);
    }
  }

  async cache(key: string, executablePromise, ttl = REDIS_DURATION_MONTH) {
    const data = await this.get(key);
    if (!data) {
      const dataCallback = await executablePromise;

      if (!dataCallback) {
        return dataCallback;
      }

      await this.set(key, dataCallback, ttl);
      return dataCallback;
    }

    return data;
  }

  inputFormat(value: unknown): string {
    return JSON.stringify(value);
  }

  outputFormat(value: unknown) {
    if (typeof value !== 'string') {
      return value ?? null;
    }
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
}
