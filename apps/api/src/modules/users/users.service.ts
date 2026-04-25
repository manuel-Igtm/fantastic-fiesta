import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../database/prisma.service';

import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      preferredLanguage: user.preferredLanguage,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
      profile: user.profile,
    };
  }

  async updateMe(userId: string, payload: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const profileUpdateData: Prisma.ProfileUpdateInput = {};
    const profileCreateData: Prisma.ProfileUncheckedCreateInput = {
      userId
    };
    if (payload.firstName !== undefined) {
      profileUpdateData.firstName = payload.firstName;
      profileCreateData.firstName = payload.firstName;
    }
    if (payload.lastName !== undefined) {
      profileUpdateData.lastName = payload.lastName;
      profileCreateData.lastName = payload.lastName;
    }
    if (payload.country !== undefined) {
      profileUpdateData.country = payload.country;
      profileCreateData.country = payload.country;
    }
    if (payload.currency !== undefined) {
      profileUpdateData.currency = payload.currency;
      profileCreateData.currency = payload.currency;
    }
    if (payload.monthlyBaselineExpense !== undefined) {
      const monthlyBaselineExpense = new Prisma.Decimal(payload.monthlyBaselineExpense);
      profileUpdateData.monthlyBaselineExpense = monthlyBaselineExpense;
      profileCreateData.monthlyBaselineExpense = monthlyBaselineExpense;
    }

    const userData: Prisma.UserUpdateInput = {};
    if (payload.email !== undefined) {
      userData.email = payload.email;
    }
    if (payload.phone !== undefined) {
      userData.phone = payload.phone;
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: userData,
    });

    if (Object.keys(profileCreateData).length > 1) {
      await this.prisma.profile.upsert({
        where: { userId },
        update: profileUpdateData,
        create: profileCreateData
      });
    }

    return this.getMe(userId);
  }

  async updateLanguage(userId: string, preferredLanguage: 'en' | 'sw') {
    await this.prisma.user.update({
      where: { id: userId },
      data: { preferredLanguage },
    });

    return this.getMe(userId);
  }
}
