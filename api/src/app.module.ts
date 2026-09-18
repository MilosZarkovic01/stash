import './load-env';
import { Module } from '@nestjs/common';
import { AccountsModule } from './accounts/accounts.module';
import { AiModule } from './ai/ai.module';
import { AuthModule } from './auth/auth.module';
import { CategoriesModule } from './categories/categories.module';
import { CommonModule } from './common/common.module';
import { DatabaseModule } from './database/database.module';
import { InsightsModule } from './insights/insights.module';
import { RecurringExpensesModule } from './recurring-expenses/recurring-expenses.module';
import { SavingsGoalsModule } from './savings-goals/savings-goals.module';
import { TransactionsModule } from './transactions/transactions.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    DatabaseModule,
    CommonModule,
    AuthModule,
    UsersModule,
    AccountsModule,
    TransactionsModule,
    CategoriesModule,
    RecurringExpensesModule,
    SavingsGoalsModule,
    InsightsModule,
    AiModule,
  ],
})
export class AppModule {}
