import { IsOptional, IsString } from 'class-validator';

export class CallbackConnectionDto {
  @IsString()
  providerType!: string;

  @IsString()
  providerAccountRef!: string;

  @IsString()
  accountName!: string;

  @IsOptional()
  @IsString()
  accountMask?: string;
}
