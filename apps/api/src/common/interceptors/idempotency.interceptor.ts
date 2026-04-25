import { createHash } from 'crypto';

import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Observable, from, of } from 'rxjs';
import { mergeMap, tap } from 'rxjs/operators';

import { PrismaService } from '../../modules/database/prisma.service';
import { AuthenticatedRequest } from '../types/authenticated-request.interface';

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  private readonly logger = new Logger(IdempotencyInterceptor.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const method = req.method.toUpperCase();
    const idempotentMethods = ['POST', 'PATCH', 'PUT', 'DELETE'];
    const idempotencyKey = req.headers['idempotency-key'];
    const user = req.user;

    if (!user?.id || !idempotentMethods.includes(method) || typeof idempotencyKey !== 'string') {
      return next.handle();
    }

    const route = req.originalUrl;
    const requestHash = this.requestHash(req.body);
    const now = new Date();
    const ttlSeconds = this.configService.getOrThrow<number>('IDEMPOTENCY_KEY_TTL_SECONDS');
    const expiresAt = new Date(now.getTime() + ttlSeconds * 1000);

    return from(
      this.prismaService.idempotencyKey.findUnique({
        where: {
          userId_key_route: {
            userId: user.id,
            key: idempotencyKey,
            route
          }
        }
      })
    ).pipe(
      mergeMap((record) => {
        if (record && record.expiresAt > now && record.requestHash === requestHash && record.responseJson) {
          this.logger.debug(`Returning cached idempotent response for route ${route}`);
          return of(record.responseJson);
        }

        return next.handle().pipe(
          tap(async (responseBody) => {
            await this.prismaService.idempotencyKey.upsert({
              where: {
                userId_key_route: {
                  userId: user.id,
                  key: idempotencyKey,
                  route
                }
              },
              create: {
                userId: user.id,
                key: idempotencyKey,
                route,
                requestHash,
                responseJson: responseBody,
                statusCode: context.switchToHttp().getResponse().statusCode,
                expiresAt
              },
              update: {
                requestHash,
                responseJson: responseBody,
                statusCode: context.switchToHttp().getResponse().statusCode,
                expiresAt
              }
            });
          })
        );
      })
    );
  }

  private requestHash(payload: unknown): string {
    return createHash('sha256').update(JSON.stringify(payload ?? {})).digest('hex');
  }
}
