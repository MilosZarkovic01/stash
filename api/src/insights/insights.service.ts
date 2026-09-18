import { Injectable } from '@nestjs/common';
import { Currency, TransactionType } from '@prisma/client';
import {
  endOfUtcMonth,
  remainingDaysInUtcMonth,
  startOfUtcMonth,
} from '../common/dates';
import { toMoney } from '../common/money';
import { serializeMoney } from '../common/serialize';
import { PrismaService } from '../database/prisma.service';
import { upcomingAmountForMonth } from '../recurring-expenses/recurring-expenses.service';
import { SavingsGoalsService } from '../savings-goals/savings-goals.service';
import { computeGuidance } from './guidance';

@Injectable()
export class InsightsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly goals: SavingsGoalsService,
  ) {}

  async status(userId: string, today = new Date()) {
    const year = today.getUTCFullYear();
    const month = today.getUTCMonth() + 1;
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });
    const accounts = await this.prisma.account.findMany({ where: { userId } });
    const recurrences = await this.prisma.recurringExpense.findMany({
      where: { userId },
    });
    const currencies = Array.from(
      new Set(accounts.map((account) => account.currency)),
    );
    if (currencies.length === 0) {
      currencies.push(user.primaryCurrency);
    }

    const balances = currencies.map((currency) => ({
      currency,
      total: serializeMoney(
        accounts
          .filter((account) => account.currency === currency)
          .reduce(
            (sum, account) => sum.add(toMoney(account.currentBalance)),
            toMoney('0'),
          ),
      ),
    }));

    const byCurrency = await Promise.all(
      currencies.map(async (currency) => {
        const { income, expenses } = await this.goals.monthNet(
          userId,
          year,
          month,
          currency,
        );
        const expectedRecurring = upcomingAmountForMonth(
          recurrences,
          currency,
          year,
          month,
        );
        const goal = await this.prisma.savingsGoal.findFirst({
          where: { userId, year, month, currency },
        });
        const savingsTarget = goal ? toMoney(goal.target) : toMoney('0');
        const available = accounts
          .filter((account) => account.currency === currency)
          .reduce(
            (sum, account) => sum.add(toMoney(account.currentBalance)),
            toMoney('0'),
          );
        const remainingDays = remainingDaysInUtcMonth(today);
        const guidance = computeGuidance({
          available,
          expectedIncome: toMoney('0'),
          expectedRecurring,
          savingsTarget,
          committed: toMoney('0'),
          remainingDays,
        });
        return {
          currency,
          income: serializeMoney(income),
          expenses: serializeMoney(expenses),
          expectedRecurring: serializeMoney(expectedRecurring),
          savingsTarget: serializeMoney(savingsTarget),
          remainingDays,
          flexibleSpending: serializeMoney(guidance.flexibleSpending),
          dailyAllowance: serializeMoney(guidance.dailyAllowance),
        };
      }),
    );

    return {
      year,
      month,
      primaryCurrency: user.primaryCurrency,
      balances,
      currencies: byCurrency,
    };
  }

  async analytics(userId: string, year: number, month: number) {
    const from = startOfUtcMonth(year, month);
    const to = endOfUtcMonth(year, month);
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const prevFrom = startOfUtcMonth(prevYear, prevMonth);
    const prevTo = endOfUtcMonth(prevYear, prevMonth);

    const [current, previous, categories] = await Promise.all([
      this.prisma.transaction.findMany({
        where: {
          userId,
          type: TransactionType.EXPENSE,
          transactionDate: { gte: from, lte: to },
        },
      }),
      this.prisma.transaction.findMany({
        where: {
          userId,
          type: TransactionType.EXPENSE,
          transactionDate: { gte: prevFrom, lte: prevTo },
        },
      }),
      this.prisma.category.findMany({ where: { userId } }),
    ]);

    const categoryName = new Map(categories.map((c) => [c.id, c.name]));

    const spendingByCategory = this.groupByCategory(current, categoryName);
    const previousByCategory = this.groupByCategory(previous, categoryName);
    const names = new Set([
      ...spendingByCategory.map((row) => row.category),
      ...previousByCategory.map((row) => row.category),
    ]);
    const vsPreviousMonth = Array.from(names).map((name) => ({
      category: name,
      current:
        spendingByCategory.find((row) => row.category === name)?.amount ??
        '0.0000',
      previous:
        previousByCategory.find((row) => row.category === name)?.amount ??
        '0.0000',
    }));

    const topExpenses = [...current]
      .sort((a, b) => toMoney(b.amount).comparedTo(toMoney(a.amount)))
      .slice(0, 5)
      .map((row) => ({
        id: row.id,
        description: row.description,
        amount: serializeMoney(row.amount),
        currency: row.currency,
        transactionDate: row.transactionDate.toISOString().slice(0, 10),
        category: row.categoryId
          ? (categoryName.get(row.categoryId) ?? 'Other')
          : 'Other',
      }));

    const byDay = new Map<string, ReturnType<typeof toMoney>>();
    for (const row of current) {
      const key = `${row.currency}:${row.transactionDate.toISOString().slice(0, 10)}`;
      const prev = byDay.get(key) ?? toMoney('0');
      byDay.set(key, prev.add(toMoney(row.amount)));
    }
    const spendingOverTime = Array.from(byDay.entries())
      .map(([key, amount]) => {
        const [currency, date] = key.split(':');
        return { date, currency, amount: serializeMoney(amount) };
      })
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      year,
      month,
      spendingByCategory,
      vsPreviousMonth,
      topExpenses,
      spendingOverTime,
    };
  }

  private groupByCategory(
    rows: Array<{
      categoryId: string | null;
      amount: { toString(): string };
      currency: Currency;
    }>,
    names: Map<string, string>,
  ) {
    const map = new Map<string, ReturnType<typeof toMoney>>();
    for (const row of rows) {
      const name = row.categoryId
        ? (names.get(row.categoryId) ?? 'Other')
        : 'Other';
      const key = `${row.currency}:${name}`;
      map.set(key, (map.get(key) ?? toMoney('0')).add(toMoney(row.amount)));
    }
    const totals = new Map<Currency, ReturnType<typeof toMoney>>();
    for (const [key, amount] of map) {
      const currency = key.split(':')[0] as Currency;
      totals.set(currency, (totals.get(currency) ?? toMoney('0')).add(amount));
    }
    return Array.from(map.entries()).map(([key, amount]) => {
      const [currency, category] = key.split(':');
      const total = totals.get(currency as Currency) ?? toMoney('0');
      const share = total.isZero() ? '0.0000' : amount.div(total).toFixed(4);
      return {
        category,
        currency,
        amount: serializeMoney(amount),
        share,
      };
    });
  }
}
