import { IsIn, IsObject, IsOptional, IsString } from 'class-validator';

export class UpdateSavingsRuleDto {
  @IsOptional()
  @IsIn(['round_up', 'percentage_sweep', 'payday_sweep', 'threshold_sweep', 'fixed_amount'])
  ruleType?: string;

  @IsOptional()
  @IsObject()
  configJson?: Record<string, unknown>;

  @IsOptional()
  @IsIn(['active', 'paused'])
  status?: string;

  @IsOptional()
  @IsString()
  nextRunAt?: string;
}
