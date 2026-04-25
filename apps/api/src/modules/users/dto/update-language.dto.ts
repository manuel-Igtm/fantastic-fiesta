import { IsIn } from 'class-validator';

export class UpdateLanguageDto {
  @IsIn(['en', 'sw'])
  preferredLanguage!: 'en' | 'sw';
}
