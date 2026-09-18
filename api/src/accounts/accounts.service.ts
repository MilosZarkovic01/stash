import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Account } from '@prisma/client';
import { parseMoney } from '../common/money';
import { serializeMoney } from '../common/serialize';
import { PrismaService } from '../database/prisma.service';
import { CreateAccountDto, UpdateAccountDto } from './dto/account.dto';

@Injectable()
export class AccountsService {
  constructor(private readonly prisma: PrismaService) {}

  list(userId: string) {
    return this.prisma.account
      .findMany({ where: { userId }, orderBy: { createdAt: 'asc' } })
      .then((rows) => rows.map(serializeAccount));
  }

  async get(userId: string, id: string) {
    const account = await this.prisma.account.findFirst({
      where: { id, userId },
    });
    if (!account) {
      throw new NotFoundException('Account not found');
    }
    return serializeAccount(account);
  }

  async create(userId: string, dto: CreateAccountDto) {
    const initial = parseMoney(dto.initialBalance);
    const account = await this.prisma.account.create({
      data: {
        userId,
        name: dto.name.trim(),
        currency: dto.currency,
        initialBalance: initial,
        currentBalance: initial,
      },
    });
    return serializeAccount(account);
  }

  async update(userId: string, id: string, dto: UpdateAccountDto) {
    await this.get(userId, id);
    const account = await this.prisma.account.update({
      where: { id },
      data: { name: dto.name.trim() },
    });
    return serializeAccount(account);
  }

  async remove(userId: string, id: string) {
    await this.get(userId, id);
    const dependent = await this.prisma.transaction.count({
      where: {
        userId,
        OR: [{ accountId: id }, { destinationAccountId: id }],
      },
    });
    if (dependent > 0) {
      throw new ConflictException(
        'Account has transactions and cannot be deleted',
      );
    }
    await this.prisma.account.delete({ where: { id } });
    return { deleted: true };
  }
}

export function serializeAccount(account: Account) {
  return {
    id: account.id,
    name: account.name,
    currency: account.currency,
    initialBalance: serializeMoney(account.initialBalance),
    currentBalance: serializeMoney(account.currentBalance),
    createdAt: account.createdAt.toISOString(),
    updatedAt: account.updatedAt.toISOString(),
  };
}
