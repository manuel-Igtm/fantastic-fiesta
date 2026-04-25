import { Body, Controller, Get, Patch } from '@nestjs/common';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/types/authenticated-request.interface';

import { UpdateLanguageDto } from './dto/update-language.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UsersService } from './users.service';

@Controller()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getMe(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.getMe(user.id);
  }

  @Patch('me')
  async updateMe(
    @CurrentUser() user: AuthenticatedUser,
    @Body() payload: UpdateProfileDto
  ) {
    return this.usersService.updateMe(user.id, payload);
  }

  @Patch('me/language')
  async updateLanguage(
    @CurrentUser() user: AuthenticatedUser,
    @Body() payload: UpdateLanguageDto
  ) {
    return this.usersService.updateLanguage(user.id, payload.preferredLanguage);
  }
}
