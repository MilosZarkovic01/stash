import { parseMoney } from '../common/money';
import { computeGuidance } from './guidance';

describe('computeGuidance', () => {
  it('computes flexible spending and daily allowance', () => {
    const result = computeGuidance({
      available: parseMoney('100000'),
      expectedIncome: parseMoney('0'),
      expectedRecurring: parseMoney('40000'),
      savingsTarget: parseMoney('20000'),
      committed: parseMoney('0'),
      remainingDays: 10,
    });
    expect(result.flexibleSpending.toFixed(4)).toBe('40000.0000');
    expect(result.dailyAllowance.toFixed(4)).toBe('4000.0000');
  });

  it('uses at least the remaining-days divisor of 1 via caller', () => {
    const result = computeGuidance({
      available: parseMoney('10'),
      expectedIncome: parseMoney('0'),
      expectedRecurring: parseMoney('0'),
      savingsTarget: parseMoney('0'),
      committed: parseMoney('0'),
      remainingDays: 1,
    });
    expect(result.dailyAllowance.toFixed(4)).toBe('10.0000');
  });
});
