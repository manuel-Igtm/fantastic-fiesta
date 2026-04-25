import { Module } from '@nestjs/common';

import { SavingsRulesController } from './savings-rules.controller';
import { SavingsRulesService } from './savings-rules.service';

@Module({
  controllers: [SavingsRulesController],
  providers: [SavingsRulesService],
})
export class SavingsRulesModule {}
