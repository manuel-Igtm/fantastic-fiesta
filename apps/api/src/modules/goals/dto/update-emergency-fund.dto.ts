import { IsIn, IsNumber, Min } from 'class-validator';

export class UpdateEmergencyFundDto {
  @IsIn([6, 9, 12])
  targetMonths!: number;

  @IsNumber()
  @Min(0)
  currentAmount!: number;
}
