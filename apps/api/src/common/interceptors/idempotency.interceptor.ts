import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor
} from '@nestjs/common';
import { Observable, from } from 'rxjs';
import { mergeMap } from 'rxjs/operators';

import { PrismaService } from '../../modules/database/prisma.service';
import { AuthenticatedRequest } from '../types/authenticated-request.interface';

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  constructor(private readonly prismaService: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const method = req.method.toUpperCase();
    const idempotentMethods = ['POST', 'PATCH', 'PUT', 'DELETE'];
    const idempotencyKey = req.headers['idempotency-key'];
    const user = req.user;

    if (!user?.id || !idempotentMethods.includes(method) || !idempotencyKey) {
      return next.handle();
    }

    const route = req.originalUrl;
    const requestHash = JSON.stringify(req.body ?? {});

    return from(
      this.prismaService.idempotencyKey.findUnique({
        where: {
          userId_key_route: {
            userId: user.id,
            key: String(idempotencyKey),
            route
          }
        }
      })
    ).pipe(
      mergeMap((record) => {
        if (record?.requestHash === requestHash && record.responseJson) {
          return from(Promise.resolve(record.responseJson));
        }
        return next.handle();
      })
    );
  }
}
