import { Injectable, NotFoundException } from '@nestjs/common';
import type { Request } from 'express';

import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class AlertsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService
  ) {}

  async listForUser(userId: string) {
    return this.prisma.alert.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async resolve(userId: string, alertId: string, request?: Request) {
    const alert = await this.prisma.alert.findFirst({
      where: { id: alertId, userId }
    });
    if (!alert) {
      throw new NotFoundException('Alert not found');
    }

    const updated = await this.prisma.alert.update({
      where: { id: alert.id },
      data: {
        status: 'resolved',
        resolvedAt: new Date()
      }
    });

    await this.auditService.log({
      actorUserId: userId,
      action: 'alert.resolve',
      objectType: 'alert',
      objectId: alertId,
      request
    });

    return updated;
  }

  async feedback(
    userId: string,
    alertId: string,
    payload: { disposition: 'valid' | 'duplicate' | 'fraud'; notes?: string },
    request?: Request
  ) {
    const alert = await this.prisma.alert.findFirst({
      where: { id: alertId, userId }
    });
    if (!alert) {
      throw new NotFoundException('Alert not found');
    }

    await this.auditService.log({
      actorUserId: userId,
      action: 'alert.feedback',
      objectType: 'alert',
      objectId: alertId,
      request
    });

    return {
      id: alert.id,
      status: alert.status,
      disposition: payload.disposition,
      notes: payload.notes ?? null
    };
  }
}
