import { Module } from '@nestjs/common';
import { TransactionsModule } from '../transactions/transactions.module';
import { RecurringExpensesController } from './recurring-expenses.controller';
import { RecurringExpensesService } from './recurring-expenses.service';

@Module({
  imports: [TransactionsModule],
  controllers: [RecurringExpensesController],
  providers: [RecurringExpensesService],
  exports: [RecurringExpensesService],
})
export class RecurringExpensesModule {}
