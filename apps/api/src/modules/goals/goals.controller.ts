import { Body, Controller, Get, Param, Patch, Post, Req } from '@nestjs/common';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedRequest, AuthenticatedUser } from '../../common/types/authenticated-request.interface';

import { ContributeGoalDto } from './dto/contribute-goal.dto';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateEmergencyFundDto } from './dto/update-emergency-fund.dto';
import { GoalsService } from './goals.service';

@Controller()
export class GoalsController {
  constructor(private readonly goalsService: GoalsService) {}

  @Post('goals')
  createGoal(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateGoalDto,
    @Req() req: AuthenticatedRequest
  ) {
    return this.goalsService.createGoal(user.id, dto, req.ip, req.headers['user-agent']);
  }

  @Get('goals')
  listGoals(@CurrentUser() user: AuthenticatedUser) {
    return this.goalsService.listGoals(user.id);
  }

  @Post('goals/:id/contribute')
  contribute(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') goalId: string,
    @Body() dto: ContributeGoalDto,
    @Req() req: AuthenticatedRequest
  ) {
    return this.goalsService.contributeToGoal(user.id, goalId, dto, req.ip, req.headers['user-agent']);
  }

  @Get('emergency-fund')
  getEmergencyFund(@CurrentUser() user: AuthenticatedUser) {
    return this.goalsService.getEmergencyFund(user.id);
  }

  @Patch('emergency-fund')
  updateEmergencyFund(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateEmergencyFundDto,
    @Req() req: AuthenticatedRequest
  ) {
    return this.goalsService.updateEmergencyFund(user.id, dto, req.ip, req.headers['user-agent']);
  }
}
