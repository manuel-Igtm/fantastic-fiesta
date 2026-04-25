import { IsIn } from 'class-validator';

export class AlertFeedbackDto {
  @IsIn(['valid', 'duplicate', 'fraud'])
  disposition!: 'valid' | 'duplicate' | 'fraud';
}
