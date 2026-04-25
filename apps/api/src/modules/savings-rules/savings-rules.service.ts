import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../database/prisma.service';

import { CreateSavingsRuleDto } from './dto/create-savings-rule.dto';
import { UpdateSavingsRuleDto } from './dto/update-savings-rule.dto';

@Injectable()
export class SavingsRulesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateSavingsRuleDto) {
    return this.prisma.savingsRule.create({
      data: {
        userId,
        ruleType: dto.ruleType,
        configJson: dto.configJson as Prisma.InputJsonValue,
        status: 'active',
        nextRunAt: dto.nextRunAt ? new Date(dto.nextRunAt) : null,
      },
    });
  }

  async list(userId: string) {
    return this.prisma.savingsRule.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(userId: string, id: string, dto: UpdateSavingsRuleDto) {
    const existing = await this.prisma.savingsRule.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new NotFoundException('Savings rule not found');
    }

    return this.prisma.savingsRule.update({
      where: { id },
      data: {
        ...(dto.ruleType ? { ruleType: dto.ruleType } : {}),
        ...(dto.configJson ? { configJson: dto.configJson as Prisma.InputJsonValue } : {}),
        ...(dto.status ? { status: dto.status } : {}),
        ...(dto.nextRunAt ? { nextRunAt: new Date(dto.nextRunAt) } : {}),
      },
    });
  }

  async pause(userId: string, id: string) {
    return this.update(userId, id, { status: 'paused' });
  }

  async resume(userId: string, id: string) {
    return this.update(userId, id, { status: 'active' });
  }
}
