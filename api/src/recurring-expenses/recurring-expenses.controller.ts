import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import type { AuthUser } from '../common/auth-user';
import { CurrentUser } from '../common/current-user.decorator';
import {
  CreateRecurringExpenseDto,
  UpdateRecurringExpenseDto,
} from './dto/recurring-expense.dto';
import { RecurringExpensesService } from './recurring-expenses.service';

@Controller('recurring-expenses')
export class RecurringExpensesController {
  constructor(private readonly recurring: RecurringExpensesService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.recurring.list(user.id);
  }

  @Post('generate')
  generate(@CurrentUser() user: AuthUser) {
    return this.recurring.generateDue(user.id);
  }

  @Get(':id')
  get(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.recurring.get(user.id, id);
  }

  @Post()
  create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateRecurringExpenseDto,
  ) {
    return this.recurring.create(user.id, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRecurringExpenseDto,
  ) {
    return this.recurring.update(user.id, id, dto);
  }

  @Delete(':id')
  remove(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.recurring.remove(user.id, id);
  }
}
