import {
  IsEmail,
  IsOptional,
  IsPhoneNumber,
  IsString,
  Length,
  Matches,
  ValidateIf
} from 'class-validator';

export class RegisterDto {
  @IsOptional()
  @ValidateIf((o: RegisterDto) => !o.email)
  @IsPhoneNumber()
  phone?: string;

  @IsOptional()
  @ValidateIf((o: RegisterDto) => !o.phone)
  @IsEmail()
  email?: string;

  @IsString()
  @Length(8, 64)
  password!: string;

  @IsOptional()
  @Matches(/^(en|sw)$/)
  preferredLanguage?: 'en' | 'sw';
}
