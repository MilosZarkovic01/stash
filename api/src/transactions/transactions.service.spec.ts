/* eslint-disable @typescript-eslint/require-await */
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Currency, TransactionType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { TransactionsService } from './transactions.service';

type AccountRow = {
  id: string;
  userId: string;
  currency: Currency;
  currentBalance: Decimal;
};

type TxRow = {
  id: string;
  userId: string;
  type: TransactionType;
  amount: Decimal;
  currency: Currency;
  description: string;
  categoryId: string | null;
  accountId: string;
  destinationAccountId: string | null;
  transactionDate: Date;
  createdAt: Date;
  updatedAt: Date;
};

function createPrismaMock() {
  const accounts = new Map<string, AccountRow>();
  const categories = new Map<string, { id: string; userId: string }>();
  const transactions = new Map<string, TxRow>();
  let seq = 1;

  const txClient = {
    account: {
      findFirst: async ({ where }: { where: { id: string; userId: string } }) =>
        [...accounts.values()].find(
          (row) => row.id === where.id && row.userId === where.userId,
        ) ?? null,
      findUnique: async ({ where }: { where: { id: string } }) =>
        accounts.get(where.id) ?? null,
      update: async ({
        where,
        data,
      }: {
        where: { id: string };
        data: { currentBalance: Decimal };
      }) => {
        const row = accounts.get(where.id);
        if (!row) {
          throw new Error('missing account');
        }
        row.currentBalance = data.currentBalance;
        return row;
      },
    },
    category: {
      findFirst: async ({ where }: { where: { id: string; userId: string } }) =>
        [...categories.values()].find(
          (row) => row.id === where.id && row.userId === where.userId,
        ) ?? null,
    },
    transaction: {
      findFirst: async ({ where }: { where: { id: string; userId: string } }) =>
        [...transactions.values()].find(
          (row) => row.id === where.id && row.userId === where.userId,
        ) ?? null,
      create: async ({
        data,
      }: {
        data: Omit<TxRow, 'id' | 'createdAt' | 'updatedAt'>;
      }) => {
        const row: TxRow = {
          ...data,
          id: `tx-${seq++}`,
          createdAt: new Date('2026-09-18T00:00:00.000Z'),
          updatedAt: new Date('2026-09-18T00:00:00.000Z'),
        };
        transactions.set(row.id, row);
        return row;
      },
      delete: async ({ where }: { where: { id: string } }) => {
        const row = transactions.get(where.id);
        transactions.delete(where.id);
        return row;
      },
    },
  };

  const prisma = {
    $transaction: async (fn: (tx: typeof txClient) => Promise<unknown>) =>
      fn(txClient),
    account: txClient.account,
    category: txClient.category,
    transaction: txClient.transaction,
    _accounts: accounts,
    _categories: categories,
    _transactions: transactions,
  };

  return prisma;
}

describe('TransactionsService', () => {
  const userId = 'user-1';
  const otherUser = 'user-2';

  function setup() {
    const prisma = createPrismaMock();
    prisma._accounts.set('cash', {
      id: 'cash',
      userId,
      currency: Currency.RSD,
      currentBalance: new Decimal('20000'),
    });
    prisma._accounts.set('savings', {
      id: 'savings',
      userId,
      currency: Currency.RSD,
      currentBalance: new Decimal('5000'),
    });
    prisma._accounts.set('eur', {
      id: 'eur',
      userId,
      currency: Currency.EUR,
      currentBalance: new Decimal('100'),
    });
    prisma._categories.set('taxi', { id: 'taxi', userId });
    const service = new TransactionsService(prisma as never);
    return { prisma, service };
  }

  it('creates an expense and decreases the source balance', async () => {
    const { prisma, service } = setup();
    await service.create(userId, {
      type: TransactionType.EXPENSE,
      amount: '3400.50',
      currency: Currency.RSD,
      description: 'dinner',
      categoryId: 'taxi',
      accountId: 'cash',
      transactionDate: '2026-09-18',
    });
    expect(prisma._accounts.get('cash')?.currentBalance.toFixed(4)).toBe(
      '16599.5000',
    );
  });

  it('creates income and increases the balance', async () => {
    const { prisma, service } = setup();
    await service.create(userId, {
      type: TransactionType.INCOME,
      amount: '1000',
      currency: Currency.RSD,
      description: 'bonus',
      accountId: 'cash',
      transactionDate: '2026-09-18',
    });
    expect(prisma._accounts.get('cash')?.currentBalance.toFixed(4)).toBe(
      '21000.0000',
    );
  });

  it('transfers atomically without changing the combined total', async () => {
    const { prisma, service } = setup();
    await service.create(userId, {
      type: TransactionType.TRANSFER,
      amount: '20000',
      currency: Currency.RSD,
      description: 'to cash',
      accountId: 'cash',
      destinationAccountId: 'savings',
      transactionDate: '2026-09-18',
    });
    const cash = prisma._accounts.get('cash')!.currentBalance;
    const savings = prisma._accounts.get('savings')!.currentBalance;
    expect(cash.plus(savings).toFixed(4)).toBe('25000.0000');
    expect(cash.toFixed(4)).toBe('0.0000');
    expect(savings.toFixed(4)).toBe('25000.0000');
  });

  it('rejects cross-currency transfers', async () => {
    const { service } = setup();
    await expect(
      service.create(userId, {
        type: TransactionType.TRANSFER,
        amount: '10',
        currency: Currency.RSD,
        description: 'fx',
        accountId: 'cash',
        destinationAccountId: 'eur',
        transactionDate: '2026-09-18',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('does not expose another users transaction', async () => {
    const { service } = setup();
    await expect(service.get(otherUser, 'missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('reverses an expense on delete', async () => {
    const { prisma, service } = setup();
    const created = await service.create(userId, {
      type: TransactionType.EXPENSE,
      amount: '1000',
      currency: Currency.RSD,
      description: 'taxi',
      categoryId: 'taxi',
      accountId: 'cash',
      transactionDate: '2026-09-18',
    });
    await service.remove(userId, created.id);
    expect(prisma._accounts.get('cash')?.currentBalance.toFixed(4)).toBe(
      '20000.0000',
    );
  });
});
