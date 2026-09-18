import { Decimal } from '@prisma/client/runtime/library';

const MONEY_PATTERN = /^-?\d+(\.\d{1,4})?$/;

export function parseMoney(value: string): Decimal {
  const normalized = value.trim();
  if (!MONEY_PATTERN.test(normalized)) {
    throw new Error('Invalid money amount');
  }
  return new Decimal(normalized);
}

export function addMoney(left: Decimal, right: Decimal): Decimal {
  return left.plus(right);
}

export function subtractMoney(left: Decimal, right: Decimal): Decimal {
  return left.minus(right);
}

export function formatMoney(value: Decimal): string {
  return value.toFixed(4);
}

export function toMoney(value: Decimal | { toString(): string }): Decimal {
  return value instanceof Decimal ? value : new Decimal(value.toString());
}

export function divideMoney(value: Decimal, divisor: number): Decimal {
  if (divisor === 0) {
    return new Decimal(0);
  }
  return value.div(divisor);
}

export function assertPositiveMoney(value: Decimal): void {
  if (value.lte(0)) {
    throw new Error('Amount must be positive');
  }
}
