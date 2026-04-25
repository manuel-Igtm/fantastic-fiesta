import 'reflect-metadata';

import { validateEnv } from './env.validation';

describe('validateEnv', () => {
  const baseEnv = {
    API_PORT: 3000,
    DATABASE_URL: 'postgres://localhost:5432/save_sabi',
    REDIS_URL: 'redis://localhost:6379',
    JWT_ACCESS_SECRET: 'access-secret',
    JWT_REFRESH_SECRET: 'refresh-secret',
    JWT_ACCESS_TTL: 900,
    JWT_REFRESH_TTL: 86_400,
    TOKENIZATION_SECRET: 'tokenization-secret',
    CALLBACK_SIGNING_SECRET: 'callback-signing-secret',
    IDEMPOTENCY_KEY_TTL_SECONDS: 3_600,
    PARTNER_CALLBACK_SECRET: 'partner-secret',
    AI_ORCHESTRATOR_URL: 'http://localhost:8001'
  };

  it('validates a full secure environment configuration', () => {
    expect(() => validateEnv(baseEnv)).not.toThrow();
  });

  it('throws when callback signing secret is missing', () => {
    const invalid: Partial<typeof baseEnv> = { ...baseEnv };
    delete invalid.CALLBACK_SIGNING_SECRET;

    expect(() => validateEnv(invalid)).toThrow();
  });

  it('throws when idempotency ttl is below minimum', () => {
    const invalid = {
      ...baseEnv,
      IDEMPOTENCY_KEY_TTL_SECONDS: 1
    };

    expect(() => validateEnv(invalid)).toThrow();
  });
});
