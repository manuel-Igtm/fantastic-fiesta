import { UnauthorizedException } from '@nestjs/common';

import { AuthService } from './auth.service';

type RefreshTokenRecord = {
  id: string;
  tokenHash: string;
  userId: string;
  sessionId: string;
  expiresAt: Date;
  revokedAt: Date | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  user: {
    id: string;
    email: string | null;
    phone: string | null;
    role: string;
    preferredLanguage: string;
  };
};

function createConfigServiceMock() {
  const values: Record<string, string> = {
    JWT_ACCESS_SECRET: 'access-secret',
    JWT_REFRESH_SECRET: 'refresh-secret',
    JWT_ACCESS_TTL: '900',
    JWT_REFRESH_TTL: '3600'
  };
  return {
    getOrThrow: jest.fn((key: string) => values[key])
  };
}

describe('AuthService.refresh', () => {
  it('rejects refresh when hashed context does not match stored fingerprint', async () => {
    const refreshTokenRecord: RefreshTokenRecord = {
      id: 'rt-1',
      tokenHash: 'hash',
      userId: 'user-1',
      sessionId: 'session-1',
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: null,
      ipAddress: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      userAgent: null,
      user: {
        id: 'user-1',
        email: 'user@example.com',
        phone: null,
        role: 'user',
        preferredLanguage: 'en'
      }
    };

    const prismaMock = {
      user: {
        findFirst: jest.fn(),
        findUnique: jest.fn()
      },
      refreshToken: {
        findFirst: jest.fn().mockResolvedValue(refreshTokenRecord),
        update: jest.fn(),
        updateMany: jest.fn(),
        create: jest.fn()
      }
    };

    const jwtServiceMock = {
      signAsync: jest.fn()
    };

    const service = new AuthService(
      prismaMock as never,
      jwtServiceMock as never,
      createConfigServiceMock() as never
    );

    await expect(
      service.refresh(
        { refreshToken: 'token-value' },
        {
          ip: '203.0.113.10',
          userAgent: 'Mozilla/5.0'
        }
      )
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(prismaMock.refreshToken.update).not.toHaveBeenCalled();
  });
});
