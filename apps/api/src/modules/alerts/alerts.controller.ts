import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Req } from '@nestjs/common';
import type { Request } from 'express';

import { CurrentUser } from '../../common/decorators/current-user.decorator';

import { AlertsService } from './alerts.service';
import { AlertFeedbackDto } from './dto/alert-feedback.dto';

@Controller('alerts')
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Get()
  list(@CurrentUser('id') userId: string) {
    return this.alertsService.listForUser(userId);
  }

  @Post(':id/resolve')
  resolve(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: Request
  ) {
    return this.alertsService.resolve(userId, id, req);
  }

  @Post(':id/feedback')
  submitFeedback(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() payload: AlertFeedbackDto,
    @Req() req: Request
  ) {
    return this.alertsService.feedback(userId, id, payload, req);
  }
}
