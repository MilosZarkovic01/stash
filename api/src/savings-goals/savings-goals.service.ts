import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SavingsGoal, TransactionType } from '@prisma/client';
import { endOfUtcMonth, startOfUtcMonth } from '../common/dates';
import { assertPositiveMoney, parseMoney, toMoney } from '../common/money';
import { serializeMoney } from '../common/serialize';
import { PrismaService } from '../database/prisma.service';
import {
  CreateSavingsGoalDto,
  UpdateSavingsGoalDto,
} from './dto/savings-goal.dto';

@Injectable()
export class SavingsGoalsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string) {
    const rows = await this.prisma.savingsGoal.findMany({
      where: { userId },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });
    return Promise.all(rows.map((row) => this.withProgress(userId, row)));
  }

  async get(userId: string, id: string) {
    const row = await this.prisma.savingsGoal.findFirst({
      where: { id, userId },
    });
    if (!row) {
      throw new NotFoundException('Savings goal not found');
    }
    return this.withProgress(userId, row);
  }

  async create(userId: string, dto: CreateSavingsGoalDto) {
    const target = parseMoney(dto.target);
    try {
      assertPositiveMoney(target);
    } catch {
      throw new BadRequestException('Target must be positive');
    }
    try {
      const row = await this.prisma.savingsGoal.create({
        data: {
          userId,
          name: dto.name.trim(),
          currency: dto.currency,
          target,
          year: dto.year,
          month: dto.month,
        },
      });
      return this.withProgress(userId, row);
    } catch {
      throw new ConflictException(
        'A savings goal already exists for that month and currency',
      );
    }
  }

  async update(userId: string, id: string, dto: UpdateSavingsGoalDto) {
    await this.get(userId, id);
    if (dto.target) {
      try {
        assertPositiveMoney(parseMoney(dto.target));
      } catch {
        throw new BadRequestException('Target must be positive');
      }
    }
    const row = await this.prisma.savingsGoal.update({
      where: { id },
      data: {
        name: dto.name?.trim(),
        target: dto.target ? parseMoney(dto.target) : undefined,
      },
    });
    return this.withProgress(userId, row);
  }

  async remove(userId: string, id: string) {
    await this.get(userId, id);
    await this.prisma.savingsGoal.delete({ where: { id } });
    return { deleted: true };
  }

  async monthNet(
    userId: string,
    year: number,
    month: number,
    currency: SavingsGoal['currency'],
  ) {
    const from = startOfUtcMonth(year, month);
    const to = endOfUtcMonth(year, month);
    const txs = await this.prisma.transaction.findMany({
      where: {
        userId,
        currency,
        transactionDate: { gte: from, lte: to },
        type: { in: [TransactionType.INCOME, TransactionType.EXPENSE] },
      },
    });
    let income = toMoney('0');
    let expenses = toMoney('0');
    for (const tx of txs) {
      if (tx.type === TransactionType.INCOME) {
        income = income.add(toMoney(tx.amount));
      } else {
        expenses = expenses.add(toMoney(tx.amount));
      }
    }
    return { income, expenses, net: income.minus(expenses) };
  }

  private async withProgress(userId: string, row: SavingsGoal) {
    const { net } = await this.monthNet(
      userId,
      row.year,
      row.month,
      row.currency,
    );
    const target = toMoney(row.target);
    const progress = net.greaterThan(0) ? net : toMoney('0');
    const remaining = target.minus(progress);
    return {
      id: row.id,
      name: row.name,
      currency: row.currency,
      target: serializeMoney(target),
      year: row.year,
      month: row.month,
      progress: serializeMoney(progress),
      remaining: serializeMoney(
        remaining.greaterThan(0) ? remaining : toMoney('0'),
      ),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
