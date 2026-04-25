import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { PartnerSignatureGuard } from '../../common/guards/partner-signature.guard';
import { AuthenticatedUser } from '../../common/types/authenticated-request.interface';

import { ConnectionsService } from './connections.service';
import { CallbackConnectionDto } from './dto/callback-connection.dto';
import { InitiateConnectionDto } from './dto/initiate-connection.dto';

@Controller('connections')
export class ConnectionsController {
  constructor(private readonly connectionsService: ConnectionsService) {}

  @Post('initiate')
  initiate(@CurrentUser() user: AuthenticatedUser, @Body() payload: InitiateConnectionDto) {
    return this.connectionsService.initiateConnection(user.id, payload);
  }

  @Post('callback')
  @Public()
  @UseGuards(PartnerSignatureGuard)
  callback(@Req() req: Request, @Body() payload: CallbackConnectionDto) {
    const userId = req.headers['x-user-id'];
    if (typeof userId !== 'string' || userId.length === 0) {
      throw new Error('Missing x-user-id header for callback');
    }
    return this.connectionsService.callbackConnection(userId, payload);
  }

  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.connectionsService.listConnections(user.id);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.connectionsService.deleteConnection(user.id, id);
  }
}
