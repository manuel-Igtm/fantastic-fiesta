import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { ParseUUIDPipe } from '@nestjs/common/pipes/parse-uuid.pipe';

import { CurrentUser } from '../../common/decorators/current-user.decorator';

import { UpdateTransactionCategoryDto } from './dto/update-transaction-category.dto';
import { TransactionsService } from './transactions.service';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  listTransactions(
    @CurrentUser('id') userId: string,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string
  ) {
    return this.transactionsService.list(userId, limit ? Number(limit) : 50, cursor);
  }

  @Patch(':id/category')
  updateCategory(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) transactionId: string,
    @Body() payload: UpdateTransactionCategoryDto
  ) {
    return this.transactionsService.updateCategory(userId, transactionId, payload.categoryId);
  }

  @Get('summary')
  getSummary(
    @CurrentUser('id') userId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    return this.transactionsService.getSummary(userId, startDate, endDate);
  }
}
