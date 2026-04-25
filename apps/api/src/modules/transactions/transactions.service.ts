import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../database/prisma.service';

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string, limit = 50, cursor?: string) {
    return this.prisma.transaction.findMany({
      where: {
        account: {
          userId
        }
      },
      include: {
        category: true,
        account: {
          select: {
            id: true,
            accountName: true,
            providerType: true
          }
        }
      },
      orderBy: {
        occurredAt: 'desc'
      },
      take: Math.min(limit, 100),
      ...(cursor
        ? {
            cursor: {
              id: cursor
            },
            skip: 1
          }
        : {})
    });
  }

  async updateCategory(userId: string, transactionId: string, categoryId: string) {
    const transaction = await this.prisma.transaction.findFirst({
      where: {
        id: transactionId,
        account: {
          userId
        }
      }
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    return this.prisma.transaction.update({
      where: { id: transactionId },
      data: { categoryId },
      include: { category: true }
    });
  }

  async getSummary(userId: string, startDate?: string, endDate?: string) {
    const from = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
    const to = endDate ? new Date(endDate) : new Date();

    const grouped = await this.prisma.transaction.groupBy({
      by: ['direction'],
      _sum: {
        amount: true
      },
      where: {
        account: {
          userId
        },
        occurredAt: {
          gte: from,
          lte: to
        }
      }
    });

    const totals = grouped.reduce(
      (acc, item) => {
        const numericAmount = Number(item._sum.amount ?? 0);
        if (item.direction === 'in') {
          acc.inflow += numericAmount;
        }
        if (item.direction === 'out') {
          acc.outflow += numericAmount;
        }
        return acc;
      },
      { inflow: 0, outflow: 0 }
    );

    const essentialSpendRows = await this.prisma.transaction.findMany({
      where: {
        account: {
          userId
        },
        direction: 'out',
        occurredAt: {
          gte: from,
          lte: to
        }
      },
      select: {
        amount: true,
        category: {
          select: {
            isEssential: true
          }
        }
      }
    });

    const essentialSpend = essentialSpendRows
      .filter((item) => item.category?.isEssential)
      .reduce((sum, item) => sum + Number(item.amount), 0);

    const nonEssentialSpend = totals.outflow - essentialSpend;
    const haraHachiBuRatio = totals.outflow > 0 ? essentialSpend / totals.outflow : 0;

    return {
      window: {
        from: from.toISOString(),
        to: to.toISOString()
      },
      inflow: totals.inflow,
      outflow: totals.outflow,
      netCashFlow: totals.inflow - totals.outflow,
      essentialSpend,
      nonEssentialSpend,
      haraHachiBuRatio
    };
  }
}
