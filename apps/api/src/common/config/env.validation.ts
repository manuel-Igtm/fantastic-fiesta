import { plainToInstance } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min, validateSync } from 'class-validator';

class EnvironmentVariables {
  @IsOptional()
  @IsString()
  NODE_ENV?: string;

  @IsInt()
  @Min(1)
  API_PORT!: number;

  @IsString()
  DATABASE_URL!: string;

  @IsString()
  REDIS_URL!: string;

  @IsString()
  JWT_ACCESS_SECRET!: string;

  @IsString()
  JWT_REFRESH_SECRET!: string;

  @IsInt()
  @Min(60)
  JWT_ACCESS_TTL!: number;

  @IsInt()
  @Min(300)
  JWT_REFRESH_TTL!: number;

  @IsString()
  TOKENIZATION_SECRET!: string;

  @IsString()
  CALLBACK_SIGNING_SECRET!: string;

  @IsInt()
  @Min(60)
  IDEMPOTENCY_KEY_TTL_SECONDS!: number;

  @IsOptional()
  @IsString()
  PARTNER_CALLBACK_SECRET?: string;

  @IsString()
  AI_ORCHESTRATOR_URL!: string;
}

export function validateEnv(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }
  return validatedConfig;
}
