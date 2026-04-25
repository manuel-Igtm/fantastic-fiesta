import { randomBytes } from 'crypto';

import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import { compare, hash } from 'bcryptjs';

import { PrismaService } from '../database/prisma.service';

import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

type AuthContext = {
  ip?: string;
  userAgent?: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}

  async register(dto: RegisterDto, context?: AuthContext) {
    if (!dto.email && !dto.phone) {
      throw new BadRequestException('Either email or phone must be provided');
    }

    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: dto.email ?? undefined }, { phone: dto.phone ?? undefined }]
      }
    });
    if (existing) {
      throw new UnauthorizedException('User already exists');
    }

    const passwordHash = await hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        phone: dto.phone,
        passwordHash,
        preferredLanguage: dto.preferredLanguage
      }
    });

    return this.issueTokenPair(user, context);
  }

  async login(dto: LoginDto, context?: AuthContext) {
    if (!dto.email && !dto.phone) {
      throw new BadRequestException('Either email or phone is required');
    }

    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: dto.email ?? undefined }, { phone: dto.phone ?? undefined }]
      }
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.issueTokenPair(user, context);
  }

  async refresh(dto: RefreshDto) {
    const tokenHash = await hash(dto.refreshToken, 4);
    const tokenRecord = await this.prisma.refreshToken.findFirst({
      where: {
        tokenHash,
        revokedAt: null,
        expiresAt: { gt: new Date() }
      },
      include: {
        user: true
      }
    });

    if (!tokenRecord) {
      throw new UnauthorizedException('Refresh token is invalid or expired');
    }

    await this.prisma.refreshToken.update({
      where: { id: tokenRecord.id },
      data: { revokedAt: new Date() }
    });

    return this.issueTokenPair(tokenRecord.user);
  }

  async logout(userId: string) {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() }
    });
  }

  async validateUser(payload: JwtPayload): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub }
    });

    if (!user || user.status !== 'active') {
      throw new UnauthorizedException('User is not active');
    }

    return user;
  }

  private async issueTokenPair(user: User, context?: AuthContext) {
    const sessionId = randomBytes(16).toString('hex');
    const payload: JwtPayload = {
      sub: user.id,
      role: user.role
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
      expiresIn: Number(this.configService.getOrThrow<string>('JWT_ACCESS_TTL'))
    });

    const refreshTokenRaw = randomBytes(48).toString('hex');
    const refreshTokenJwt = await this.jwtService.signAsync(
      { ...payload, nonce: refreshTokenRaw },
      {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: Number(this.configService.getOrThrow<string>('JWT_REFRESH_TTL'))
      }
    );

    const tokenHash = await hash(refreshTokenJwt, 4);
    const expiresAt = new Date(
      Date.now() + Number(this.configService.getOrThrow<string>('JWT_REFRESH_TTL')) * 1000
    );

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
        sessionId,
        ipAddress: context?.ip ?? null,
        userAgent: context?.userAgent ?? null
      }
    });

    return {
      accessToken,
      refreshToken: refreshTokenJwt,
      tokenType: 'Bearer',
      expiresInSeconds: Number(this.configService.getOrThrow<string>('JWT_ACCESS_TTL')),
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        preferredLanguage: user.preferredLanguage
      }
    };
  }
}
