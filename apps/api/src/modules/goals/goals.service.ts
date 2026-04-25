import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Request } from 'express';

import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../database/prisma.service';

import { ContributeGoalDto } from './dto/contribute-goal.dto';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateEmergencyFundDto } from './dto/update-emergency-fund.dto';

@Injectable()
export class GoalsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async createGoal(userId: string, dto: CreateGoalDto, ip?: string, userAgent?: string) {
    const goal = await this.prisma.goal.create({
      data: {
        userId,
        title: dto.title,
        targetAmount: dto.targetAmount,
        dueDate: new Date(dto.dueDate),
        priority: dto.priority,
        imageUrl: dto.imageUrl,
      },
    });

    await this.auditService.log({
      actorUserId: userId,
      action: 'goal.create',
      objectType: 'goal',
      objectId: goal.id,
      request: {
        ip,
        headers: { 'user-agent': userAgent ?? '' }
      } as Request,
    });

    return goal;
  }

  listGoals(userId: string) {
    return this.prisma.goal.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        contributions: {
          take: 10,
          orderBy: { contributedAt: 'desc' },
        },
      },
    });
  }

  async contributeToGoal(
    userId: string,
    goalId: string,
    dto: ContributeGoalDto,
    ip?: string,
    userAgent?: string,
  ) {
    const goal = await this.prisma.goal.findFirst({
      where: { id: goalId, userId },
    });

    if (!goal) {
      throw new NotFoundException('Goal not found');
    }

    const contribution = await this.prisma.$transaction(async (tx) => {
      const created = await tx.goalContribution.create({
        data: {
          goalId,
          sourceAccountId: dto.sourceAccountId,
          amount: dto.amount,
          method: dto.method,
        },
      });

      const updatedCurrent = new Prisma.Decimal(goal.currentAmount).add(dto.amount);
      await tx.goal.update({
        where: { id: goal.id },
        data: {
          currentAmount: updatedCurrent,
          status:
            updatedCurrent.gte(goal.targetAmount) && goal.status !== 'completed'
              ? 'completed'
              : goal.status,
        },
      });

      return created;
    });

    await this.auditService.log({
      actorUserId: userId,
      action: 'goal.contribute',
      objectType: 'goal',
      objectId: goalId,
      request: {
        ip,
        headers: { 'user-agent': userAgent ?? '' }
      } as Request,
    });

    return contribution;
  }

  async getEmergencyFund(userId: string) {
    const emergencyFund = await this.prisma.emergencyFund.findUnique({
      where: { userId },
    });

    if (emergencyFund) {
      return emergencyFund;
    }

    const profile = await this.prisma.profile.findUnique({
      where: { userId },
    });

    const monthlyBaselineExpense = profile?.monthlyBaselineExpense
      ? Number(profile.monthlyBaselineExpense)
      : 0;
    const targetMonths = 6;
    const targetAmount = monthlyBaselineExpense * targetMonths;

    return this.prisma.emergencyFund.create({
      data: {
        userId,
        targetMonths,
        targetAmount,
        currentAmount: 0,
        healthStatus: 'building',
      },
    });
  }

  async updateEmergencyFund(
    userId: string,
    dto: UpdateEmergencyFundDto,
    ip?: string,
    userAgent?: string,
  ) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
    });
    const monthlyBaselineExpense = profile?.monthlyBaselineExpense
      ? Number(profile.monthlyBaselineExpense)
      : 0;
    const targetAmount = monthlyBaselineExpense * dto.targetMonths;

    const emergencyFund = await this.prisma.emergencyFund.upsert({
      where: { userId },
      create: {
        userId,
        targetMonths: dto.targetMonths,
        targetAmount,
        currentAmount: 0,
        healthStatus: 'building',
      },
      update: {
        targetMonths: dto.targetMonths,
        targetAmount,
        healthStatus: 'building',
      },
    });

    await this.auditService.log({
      actorUserId: userId,
      action: 'emergency_fund.update',
      objectType: 'emergency_fund',
      objectId: emergencyFund.id,
      request: {
        ip,
        headers: { 'user-agent': userAgent ?? '' }
      } as Request,
    });

    return emergencyFund;
  }
}
