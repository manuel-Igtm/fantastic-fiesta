import { Module } from '@nestjs/common';

import { AuditModule } from '../audit/audit.module';
import { DatabaseModule } from '../database/database.module';

import { AlertsController } from './alerts.controller';
import { AlertsService } from './alerts.service';

@Module({
  imports: [DatabaseModule, AuditModule],
  controllers: [AlertsController],
  providers: [AlertsService],
})
export class AlertsModule {}
