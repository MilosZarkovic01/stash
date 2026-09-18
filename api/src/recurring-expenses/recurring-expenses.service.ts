import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  RecurrenceFrequency,
  RecurringExpense,
  TransactionType,
} from '@prisma/client';
import { addUtcMonths, utcDateOnly } from '../common/dates';
import { assertPositiveMoney, parseMoney, toMoney } from '../common/money';
import { serializeMoney } from '../common/serialize';
import { PrismaService } from '../database/prisma.service';
import { TransactionsService } from '../transactions/transactions.service';
import {
  CreateRecurringExpenseDto,
  UpdateRecurringExpenseDto,
} from './dto/recurring-expense.dto';

@Injectable()
export class RecurringExpensesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly transactions: TransactionsService,
  ) {}

  async list(userId: string) {
    const rows = await this.prisma.recurringExpense.findMany({
      where: { userId },
      orderBy: { nextOccurrence: 'asc' },
    });
    return rows.map(serializeRecurring);
  }

  async get(userId: string, id: string) {
    const row = await this.prisma.recurringExpense.findFirst({
      where: { id, userId },
    });
    if (!row) {
      throw new NotFoundException('Recurring expense not found');
    }
    return serializeRecurring(row);
  }

  async create(userId: string, dto: CreateRecurringExpenseDto) {
    const amount = parseMoney(dto.amount);
    try {
      assertPositiveMoney(amount);
    } catch {
      throw new BadRequestException('Amount must be positive');
    }
    await this.assertAccount(userId, dto.accountId, dto.currency);
    await this.assertCategory(userId, dto.categoryId);
    const row = await this.prisma.recurringExpense.create({
      data: {
        userId,
        name: dto.name.trim(),
        amount,
        currency: dto.currency,
        categoryId: dto.categoryId,
        accountId: dto.accountId,
        frequency: RecurrenceFrequency.MONTHLY,
        nextOccurrence: utcDateOnly(dto.nextOccurrence),
        active: true,
      },
    });
    return serializeRecurring(row);
  }

  async update(userId: string, id: string, dto: UpdateRecurringExpenseDto) {
    const existing = await this.prisma.recurringExpense.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      throw new NotFoundException('Recurring expense not found');
    }
    if (dto.accountId) {
      await this.assertAccount(userId, dto.accountId, existing.currency);
    }
    if (dto.categoryId) {
      await this.assertCategory(userId, dto.categoryId);
    }
    if (dto.amount) {
      try {
        assertPositiveMoney(parseMoney(dto.amount));
      } catch {
        throw new BadRequestException('Amount must be positive');
      }
    }
    const row = await this.prisma.recurringExpense.update({
      where: { id },
      data: {
        name: dto.name?.trim(),
        amount: dto.amount ? parseMoney(dto.amount) : undefined,
        categoryId: dto.categoryId,
        accountId: dto.accountId,
        nextOccurrence: dto.nextOccurrence
          ? utcDateOnly(dto.nextOccurrence)
          : undefined,
        active: dto.active,
      },
    });
    return serializeRecurring(row);
  }

  async remove(userId: string, id: string) {
    await this.get(userId, id);
    const row = await this.prisma.recurringExpense.update({
      where: { id },
      data: { active: false },
    });
    return serializeRecurring(row);
  }

  async generateDue(userId: string, today = new Date()) {
    const due = await this.prisma.recurringExpense.findMany({
      where: {
        userId,
        active: true,
        nextOccurrence: { lte: utcDateOnly(today) },
      },
    });
    const created: string[] = [];
    for (const item of due) {
      let next = utcDateOnly(item.nextOccurrence);
      const todayDate = utcDateOnly(today);
      while (next <= todayDate) {
        const description = `[recurring] ${item.name}`;
        const dateKey = next.toISOString().slice(0, 10);
        const existing = await this.prisma.transaction.findFirst({
          where: {
            userId,
            accountId: item.accountId,
            type: TransactionType.EXPENSE,
            description,
            transactionDate: next,
            amount: item.amount,
          },
        });
        if (!existing) {
          const tx = await this.transactions.create(userId, {
            type: TransactionType.EXPENSE,
            amount: serializeMoney(item.amount),
            currency: item.currency,
            description,
            categoryId: item.categoryId,
            accountId: item.accountId,
            transactionDate: dateKey,
          });
          created.push(tx.id);
        }
        next = addUtcMonths(next, 1);
      }
      await this.prisma.recurringExpense.update({
        where: { id: item.id },
        data: { nextOccurrence: next },
      });
    }
    return { createdCount: created.length, createdIds: created };
  }

  private async assertAccount(
    userId: string,
    accountId: string,
    currency: RecurringExpense['currency'],
  ) {
    const account = await this.prisma.account.findFirst({
      where: { id: accountId, userId },
    });
    if (!account) {
      throw new NotFoundException('Account not found');
    }
    if (account.currency !== currency) {
      throw new BadRequestException('Currency must match the account');
    }
  }

  private async assertCategory(userId: string, categoryId: string) {
    const category = await this.prisma.category.findFirst({
      where: { id: categoryId, userId },
    });
    if (!category) {
      throw new NotFoundException('Category not found');
    }
  }
}

export function serializeRecurring(row: RecurringExpense) {
  return {
    id: row.id,
    name: row.name,
    amount: serializeMoney(row.amount),
    currency: row.currency,
    categoryId: row.categoryId,
    accountId: row.accountId,
    frequency: row.frequency,
    nextOccurrence: row.nextOccurrence.toISOString().slice(0, 10),
    active: row.active,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function upcomingAmountForMonth(
  rows: RecurringExpense[],
  currency: RecurringExpense['currency'],
  year: number,
  month: number,
) {
  return rows
    .filter(
      (row) =>
        row.active &&
        row.currency === currency &&
        row.nextOccurrence.getUTCFullYear() === year &&
        row.nextOccurrence.getUTCMonth() + 1 === month,
    )
    .reduce((sum, row) => sum.add(toMoney(row.amount)), toMoney('0'));
}
