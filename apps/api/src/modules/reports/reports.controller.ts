import { Body, Controller, Get, Param, Post } from '@nestjs/common';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/types/authenticated-request.interface';

import { GenerateReportDto } from './dto/generate-report.dto';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post('generate')
  generate(@CurrentUser() user: AuthenticatedUser, @Body() dto: GenerateReportDto) {
    return this.reportsService.generate(user.id, dto);
  }

  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.reportsService.list(user.id);
  }

  @Get(':id/download')
  download(@CurrentUser() user: AuthenticatedUser, @Param('id') reportId: string) {
    return this.reportsService.download(user.id, reportId);
  }
}
