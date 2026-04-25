import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
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
  callback(@CurrentUser() user: AuthenticatedUser, @Body() payload: CallbackConnectionDto) {
    return this.connectionsService.callbackConnection(user.id, payload);
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
