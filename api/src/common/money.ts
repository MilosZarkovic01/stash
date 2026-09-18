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
