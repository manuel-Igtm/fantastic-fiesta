import { Injectable } from '@nestjs/common';
import { Request } from 'express';

import { PrismaService } from '../database/prisma.service';

export interface AuditContext {
  actorUserId?: string;
  action: string;
  objectType: string;
  objectId?: string;
  request?: Request;
  ip?: string;
  userAgent?: string;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(context: AuditContext): Promise<void> {
    const ip = context.ip ?? context.request?.ip ?? this.extractIp(context.request);
    const userAgent = context.userAgent ?? context.request?.headers['user-agent'];
    await this.prisma.auditLog.create({
      data: {
        actorUserId: context.actorUserId,
        action: context.action,
        objectType: context.objectType,
        objectId: context.objectId,
        ip,
        userAgent: typeof userAgent === 'string' ? userAgent : null
      }
    });
  }

  private extractIp(request?: Request): string | null {
    if (!request) {
      return null;
    }

    const forwardedFor = request.headers['x-forwarded-for'];
    if (typeof forwardedFor === 'string') {
      const [firstIp] = forwardedFor.split(',');
      return firstIp?.trim() || null;
    }

    return request.socket.remoteAddress ?? null;
  }
}
