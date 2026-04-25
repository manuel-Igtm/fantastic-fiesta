import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

import { timingSafeEqualString, verifyHmacSha256Base64Url } from '../utils/security.util';

@Injectable()
export class PartnerSignatureGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    if (context.getType() !== 'http') {
      return true;
    }

    const req = context.switchToHttp().getRequest<Request>();
    const callbackSecret = this.configService.getOrThrow<string>('PARTNER_CALLBACK_SECRET');
    const expectedProvider = req.body?.providerType;
    const provider = typeof expectedProvider === 'string' ? expectedProvider : '';

    const partner = req.headers['x-partner-id'];
    const timestamp = req.headers['x-signature-timestamp'];
    const signature = req.headers['x-signature'];
    const idempotency = req.headers['idempotency-key'];

    if (
      typeof partner !== 'string' ||
      typeof timestamp !== 'string' ||
      typeof signature !== 'string' ||
      typeof idempotency !== 'string'
    ) {
      throw new UnauthorizedException('Missing partner callback signature headers');
    }

    if (!timingSafeEqualString(partner, provider)) {
      throw new UnauthorizedException('Partner id does not match provider');
    }

    const nowSeconds = Math.floor(Date.now() / 1000);
    const requestSeconds = Number(timestamp);
    if (!Number.isFinite(requestSeconds)) {
      throw new UnauthorizedException('Invalid signature timestamp');
    }

    const maxSkewSeconds = 5 * 60;
    if (Math.abs(nowSeconds - requestSeconds) > maxSkewSeconds) {
      throw new UnauthorizedException('Signature timestamp outside allowed window');
    }

    const bodyString = JSON.stringify(req.body ?? {});
    const canonical = `${partner}.${timestamp}.${idempotency}.${bodyString}`;
    const valid = verifyHmacSha256Base64Url(callbackSecret, canonical, signature);
    if (!valid) {
      throw new UnauthorizedException('Invalid partner callback signature');
    }

    return true;
  }
}
