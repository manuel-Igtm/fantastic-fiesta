import { Type } from 'class-transformer';
import { IsDate, IsIn, IsNotEmpty, IsString } from 'class-validator';

export class GenerateReportDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['monthly_statement', 'goal_performance', 'behavior_trend'])
  reportType!: string;

  @Type(() => Date)
  @IsDate()
  periodStart!: Date;

  @Type(() => Date)
  @IsDate()
  periodEnd!: Date;
}
