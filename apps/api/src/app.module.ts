import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { validateEnv } from './common/config/env.validation';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { PartnerSignatureGuard } from './common/guards/partner-signature.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { IdempotencyInterceptor } from './common/interceptors/idempotency.interceptor';
import { AlertsModule } from './modules/alerts/alerts.module';
import { AuditModule } from './modules/audit/audit.module';
import { AuthModule } from './modules/auth/auth.module';
import { ConnectionsModule } from './modules/connections/connections.module';
import { DatabaseModule } from './modules/database/database.module';
import { GoalsModule } from './modules/goals/goals.module';
import { HealthModule } from './modules/health/health.module';
import { ReportsModule } from './modules/reports/reports.module';
import { SavingsRulesModule } from './modules/savings-rules/savings-rules.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      validate: validateEnv
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 120
      }
    ]),
    DatabaseModule,
    AuditModule,
    AuthModule,
    UsersModule,
    ConnectionsModule,
    TransactionsModule,
    SavingsRulesModule,
    GoalsModule,
    AlertsModule,
    ReportsModule,
    HealthModule,
  ],
  providers: [
    PartnerSignatureGuard,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: IdempotencyInterceptor
    }
  ]
})
export class AppModule {}
