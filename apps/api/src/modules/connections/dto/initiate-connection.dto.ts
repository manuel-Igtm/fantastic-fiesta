import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';

const PROVIDERS = ['bank', 'mpesa', 'airtel', 'equitel', 'manual', 'crypto'] as const;

export class InitiateConnectionDto {
  @IsIn(PROVIDERS)
  providerType!: (typeof PROVIDERS)[number];

  @IsString()
  @MinLength(2)
  accountName!: string;

  @IsOptional()
  @IsString()
  providerAccountRef?: string;

  @IsOptional()
  @IsString()
  accountMask?: string;
}
