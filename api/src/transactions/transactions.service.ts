import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Account, Prisma, Transaction, TransactionType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { utcDateOnly } from '../common/dates';
import {
  addMoney,
  assertPositiveMoney,
  parseMoney,
  subtractMoney,
  toMoney,
} from '../common/money';
import { serializeMoney } from '../common/serialize';
import { PrismaService } from '../database/prisma.service';
import {
  CreateTransactionDto,
  UpdateTransactionDto,
} from './dto/transaction.dto';

type TxClient = Prisma.TransactionClient;

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string, query: { accountId?: string; take?: number }) {
    const rows = await this.prisma.transaction.findMany({
      where: {
        userId,
        accountId: query.accountId,
      },
      orderBy: [{ transactionDate: 'desc' }, { createdAt: 'desc' }],
      take: Math.min(query.take ?? 50, 100),
    });
    return rows.map(serializeTransaction);
  }

  async get(userId: string, id: string) {
    const row = await this.prisma.transaction.findFirst({
      where: { id, userId },
    });
    if (!row) {
      throw new NotFoundException('Transaction not found');
    }
    return serializeTransaction(row);
  }

  create(userId: string, dto: CreateTransactionDto) {
    return this.prisma.$transaction((tx) => this.createInTx(tx, userId, dto));
  }

  async update(userId: string, id: string, dto: UpdateTransactionDto) {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.transaction.findFirst({
        where: { id, userId },
      });
      if (!existing) {
        throw new NotFoundException('Transaction not found');
      }
      await this.reverseEffects(tx, userId, existing);
      const next: CreateTransactionDto = {
        type: dto.type ?? existing.type,
        amount: dto.amount ?? serializeMoney(existing.amount),
        currency: dto.currency ?? existing.currency,
        description: dto.description ?? existing.description,
        categoryId:
          dto.categoryId === undefined
            ? (existing.categoryId ?? undefined)
            : (dto.categoryId ?? undefined),
        accountId: dto.accountId ?? existing.accountId,
        destinationAccountId:
          dto.destinationAccountId === undefined
            ? (existing.destinationAccountId ?? undefined)
            : (dto.destinationAccountId ?? undefined),
        transactionDate:
          dto.transactionDate ??
          existing.transactionDate.toISOString().slice(0, 10),
      };
      await tx.transaction.delete({ where: { id } });
      const created = await this.createInTx(tx, userId, next);
      return created;
    });
  }

  async remove(userId: string, id: string) {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.transaction.findFirst({
        where: { id, userId },
      });
      if (!existing) {
        throw new NotFoundException('Transaction not found');
      }
      await this.reverseEffects(tx, userId, existing);
      await tx.transaction.delete({ where: { id } });
      return { deleted: true };
    });
  }

  private async createInTx(
    tx: TxClient,
    userId: string,
    dto: CreateTransactionDto,
  ) {
    const amount = parseMoney(dto.amount);
    try {
      assertPositiveMoney(amount);
    } catch {
      throw new BadRequestException('Amount must be positive');
    }

    const account = await this.requireAccount(tx, userId, dto.accountId);
    if (account.currency !== dto.currency) {
      throw new BadRequestException('Currency must match the account');
    }

    if (dto.type === TransactionType.TRANSFER) {
      if (!dto.destinationAccountId) {
        throw new BadRequestException(
          'Transfer requires a destination account',
        );
      }
      if (dto.destinationAccountId === dto.accountId) {
        throw new BadRequestException('Transfer accounts must differ');
      }
      const destination = await this.requireAccount(
        tx,
        userId,
        dto.destinationAccountId,
      );
      if (destination.currency !== account.currency) {
        throw new BadRequestException(
          'Transfers require the same currency on both accounts',
        );
      }
      await this.adjustBalance(
        tx,
        account.id,
        subtractMoney(toMoney(0), amount),
      );
      await this.adjustBalance(tx, destination.id, amount);
    } else if (dto.type === TransactionType.EXPENSE) {
      if (!dto.categoryId) {
        throw new BadRequestException('Expense requires a category');
      }
      await this.requireCategory(tx, userId, dto.categoryId);
      await this.adjustBalance(tx, account.id, amount.negated());
    } else {
      if (dto.categoryId) {
        await this.requireCategory(tx, userId, dto.categoryId);
      }
      await this.adjustBalance(tx, account.id, amount);
    }

    const row = await tx.transaction.create({
      data: {
        userId,
        type: dto.type,
        amount,
        currency: dto.currency,
        description: dto.description.trim(),
        categoryId:
          dto.type === TransactionType.TRANSFER
            ? null
            : (dto.categoryId ?? null),
        accountId: dto.accountId,
        destinationAccountId:
          dto.type === TransactionType.TRANSFER
            ? dto.destinationAccountId
            : null,
        transactionDate: utcDateOnly(dto.transactionDate),
      },
    });
    return serializeTransaction(row);
  }

  private async reverseEffects(tx: TxClient, userId: string, row: Transaction) {
    const amount = toMoney(row.amount);
    if (row.type === TransactionType.TRANSFER) {
      if (!row.destinationAccountId) {
        throw new BadRequestException('Transfer is missing a destination');
      }
      await this.requireAccount(tx, userId, row.accountId);
      await this.requireAccount(tx, userId, row.destinationAccountId);
      await this.adjustBalance(tx, row.accountId, amount);
      await this.adjustBalance(tx, row.destinationAccountId, amount.negated());
      return;
    }
    if (row.type === TransactionType.EXPENSE) {
      await this.adjustBalance(tx, row.accountId, amount);
      return;
    }
    await this.adjustBalance(tx, row.accountId, amount.negated());
  }

  private async requireAccount(tx: TxClient, userId: string, id: string) {
    const account = await tx.account.findFirst({ where: { id, userId } });
    if (!account) {
      throw new NotFoundException('Account not found');
    }
    return account;
  }

  private async requireCategory(tx: TxClient, userId: string, id: string) {
    const category = await tx.category.findFirst({ where: { id, userId } });
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    return category;
  }

  private async adjustBalance(tx: TxClient, accountId: string, delta: Decimal) {
    const account: Account | null = await tx.account.findUnique({
      where: { id: accountId },
    });
    if (!account) {
      throw new NotFoundException('Account not found');
    }
    await tx.account.update({
      where: { id: accountId },
      data: {
        currentBalance: addMoney(toMoney(account.currentBalance), delta),
      },
    });
  }
}

export function serializeTransaction(row: Transaction) {
  return {
    id: row.id,
    type: row.type,
    amount: serializeMoney(row.amount),
    currency: row.currency,
    description: row.description,
    categoryId: row.categoryId,
    accountId: row.accountId,
    destinationAccountId: row.destinationAccountId,
    transactionDate: row.transactionDate.toISOString().slice(0, 10),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
