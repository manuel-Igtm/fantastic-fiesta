import { Body, Controller, Get, Param, Patch, Post, UseInterceptors } from '@nestjs/common';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { IdempotencyInterceptor } from '../../common/interceptors/idempotency.interceptor';
import { AuthenticatedUser } from '../../common/types/authenticated-request.interface';

import { CreateSavingsRuleDto } from './dto/create-savings-rule.dto';
import { UpdateSavingsRuleDto } from './dto/update-savings-rule.dto';
import { SavingsRulesService } from './savings-rules.service';

@Controller('savings-rules')
export class SavingsRulesController {
  constructor(private readonly savingsRulesService: SavingsRulesService) {}

  @Post()
  @UseInterceptors(IdempotencyInterceptor)
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateSavingsRuleDto) {
    return this.savingsRulesService.create(user.id, dto);
  }

  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.savingsRulesService.list(user.id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateSavingsRuleDto
  ) {
    return this.savingsRulesService.update(user.id, id, dto);
  }

  @Post(':id/pause')
  @UseInterceptors(IdempotencyInterceptor)
  pause(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.savingsRulesService.pause(user.id, id);
  }

  @Post(':id/resume')
  @UseInterceptors(IdempotencyInterceptor)
  resume(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.savingsRulesService.resume(user.id, id);
  }
}
