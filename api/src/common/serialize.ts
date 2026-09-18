import { Decimal } from '@prisma/client/runtime/library';
import { formatMoney, toMoney } from './money';

export function serializeMoney(
  value: Decimal | { toString(): string },
): string {
  return formatMoney(toMoney(value));
}
