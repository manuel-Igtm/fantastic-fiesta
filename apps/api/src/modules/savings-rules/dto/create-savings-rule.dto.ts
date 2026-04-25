import { IsIn, IsObject, IsOptional, IsString } from 'class-validator';

const RULE_TYPES = ['round_up', 'percentage_sweep', 'payday_sweep', 'threshold_sweep', 'fixed_amount'] as const;

export class CreateSavingsRuleDto {
  @IsString()
  @IsIn(RULE_TYPES)
  ruleType!: (typeof RULE_TYPES)[number];

  @IsObject()
  configJson!: Record<string, unknown>;

  @IsOptional()
  @IsString()
  nextRunAt?: string;
}
