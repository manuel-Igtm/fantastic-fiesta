import { Module } from '@nestjs/common';

import { AuditModule } from '../audit/audit.module';
import { DatabaseModule } from '../database/database.module';

import { GoalsController } from './goals.controller';
import { GoalsService } from './goals.service';

@Module({
  imports: [DatabaseModule, AuditModule],
  controllers: [GoalsController],
  providers: [GoalsService],
})
export class GoalsModule {}
