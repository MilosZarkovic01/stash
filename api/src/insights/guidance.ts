import { Decimal } from '@prisma/client/runtime/library';
import { divideMoney } from '../common/money';

export type GuidanceInput = {
  available: Decimal;
  expectedIncome: Decimal;
  expectedRecurring: Decimal;
  savingsTarget: Decimal;
  committed: Decimal;
  remainingDays: number;
};

export function computeGuidance(input: GuidanceInput) {
  const flexibleSpending = input.available
    .plus(input.expectedIncome)
    .minus(input.expectedRecurring)
    .minus(input.savingsTarget)
    .minus(input.committed);
  return {
    flexibleSpending,
    dailyAllowance: divideMoney(flexibleSpending, input.remainingDays),
  };
}
