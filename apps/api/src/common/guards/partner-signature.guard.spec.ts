import { UnauthorizedException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

import { hmacSha256Base64Url } from '../utils/security.util';

import { PartnerSignatureGuard } from './partner-signature.guard';

type HeaderValue = string | string[] | undefined;

function makeContext(request: Partial<Request>): ExecutionContext {
  return {
    getType: () => 'http',
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => ({}),
      getNext: () => undefined
    })
  } as unknown as ExecutionContext;
}

function sign(secret: string, canonical: string): string {
  return hmacSha256Base64Url(secret, canonical);
}

describe('PartnerSignatureGuard', () => {
  const callbackSecret = 'unit-test-partner-secret';

  function makeGuard(secret = callbackSecret): PartnerSignatureGuard {
    const configService = {
      getOrThrow: jest.fn(() => secret)
    } as unknown as ConfigService;

    return new PartnerSignatureGuard(configService);
  }

  function buildRequest(overrides?: {
    providerType?: string;
    partner?: HeaderValue;
    timestamp?: HeaderValue;
    signature?: HeaderValue;
    idempotency?: HeaderValue;
    body?: Record<string, unknown>;
    clockSkewSeconds?: number;
  }): Partial<Request> {
    const providerType = overrides?.providerType ?? 'bank';
    const body = overrides?.body ?? { providerType, accountName: 'Main account' };
    const nowSeconds = Math.floor(Date.now() / 1000) + (overrides?.clockSkewSeconds ?? 0);
    const timestampValue = String(nowSeconds);
    const idempotencyValue = 'idem-key-123';
    const canonical = `${providerType}.${timestampValue}.${idempotencyValue}.${JSON.stringify(body)}`;
    const signatureValue = sign(callbackSecret, canonical);

    return {
      body,
      headers: {
        'x-partner-id': overrides?.partner ?? providerType,
        'x-signature-timestamp': overrides?.timestamp ?? timestampValue,
        'x-signature': overrides?.signature ?? signatureValue,
        'idempotency-key': overrides?.idempotency ?? idempotencyValue
      }
    };
  }

  it('accepts a valid signed callback request', () => {
    const guard = makeGuard();
    const request = buildRequest();
    const context = makeContext(request);

    expect(guard.canActivate(context)).toBe(true);
  });

  it('rejects when required signature headers are missing', () => {
    const guard = makeGuard();
    const request = buildRequest();
    delete request.headers?.['x-signature'];
    const context = makeContext(request);

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('rejects when partner header does not match provider type', () => {
    const guard = makeGuard();
    const request = buildRequest({ partner: 'mpesa' });
    const context = makeContext(request);

    expect(() => guard.canActivate(context)).toThrow('Partner id does not match provider');
  });

  it('rejects requests with stale timestamps', () => {
    const guard = makeGuard();
    const request = buildRequest({ clockSkewSeconds: -(6 * 60) });
    const context = makeContext(request);

    expect(() => guard.canActivate(context)).toThrow('Signature timestamp outside allowed window');
  });

  it('rejects when signature is invalid', () => {
    const guard = makeGuard();
    const request = buildRequest({ signature: 'invalid-signature' });
    const context = makeContext(request);

    expect(() => guard.canActivate(context)).toThrow('Invalid partner callback signature');
  });
});
