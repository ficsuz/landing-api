import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { EnvService } from './env.service';

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvService, config, {
    enableImplicitConversion: false,
  });
  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });
  if (errors.length > 0) {
    throw new Error(errors.toString());
  }
  return validatedConfig;
}
