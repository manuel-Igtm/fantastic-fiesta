import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateGoalDto {
  @IsString()
  title!: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  targetAmount!: number;

  @IsDateString()
  dueDate!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  priority!: number;

  @IsOptional()
  @IsString()
  imageUrl?: string;
}
