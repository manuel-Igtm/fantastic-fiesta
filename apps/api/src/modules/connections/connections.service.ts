import { randomUUID } from 'crypto';

import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { tokenizeValue } from '../../common/utils/security.util';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class ConnectionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService
  ) {}

  async initiateConnection(userId: string, payload: { providerType: string; accountName: string }) {
    // Provider URL should be generated from integration adapters in production.
    return {
      providerType: payload.providerType,
      authorizationUrl: `https://provider.example.com/connect?provider=${payload.providerType}&user=${userId}`,
      state: randomUUID(),
    };
  }

  async callbackConnection(
    userId: string,
    payload: {
      providerType: string;
      providerAccountRef: string;
      accountName: string;
      accountMask?: string;
    },
  ) {
    const tokenizationSecret = this.configService.getOrThrow<string>('TOKENIZATION_SECRET');
    const tokenizedRef = tokenizeValue(payload.providerAccountRef, tokenizationSecret);

    return this.prisma.account.create({
      data: {
        userId,
        providerType: payload.providerType,
        providerAccountRef: tokenizedRef,
        accountName: payload.accountName,
        accountMask: payload.accountMask,
      },
    });
  }

  async listConnections(userId: string) {
    return this.prisma.account.findMany({
      where: { userId, isActive: true },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        providerType: true,
        accountName: true,
        accountMask: true,
        isActive: true,
        createdAt: true,
      },
    });
  }

  async deleteConnection(userId: string, connectionId: string) {
    const existing = await this.prisma.account.findFirst({
      where: { id: connectionId, userId },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('Connection not found');
    }

    await this.prisma.account.update({
      where: { id: connectionId },
      data: { isActive: false },
    });

    return { success: true };
  }

  async completeConnection(userId: string, payload: { connectionId: string; externalAccountRef: string }) {
    const existing = await this.prisma.account.findFirst({
      where: { id: payload.connectionId, userId },
    });

    if (!existing) {
      throw new NotFoundException('Connection not found');
    }

    const tokenizationSecret = this.configService.getOrThrow<string>('TOKENIZATION_SECRET');
    const tokenizedRef = tokenizeValue(payload.externalAccountRef, tokenizationSecret);

    return this.prisma.account.update({
      where: { id: payload.connectionId },
      data: {
        providerAccountRef: tokenizedRef,
        isActive: true,
      },
      select: {
        id: true,
        providerType: true,
        accountName: true,
        accountMask: true,
        isActive: true,
      },
    });
  }

  async removeConnection(userId: string, connectionId: string) {
    return this.deleteConnection(userId, connectionId);
  }
}
