import { Decimal } from '@prisma/client/runtime/library';
import { addMoney, formatMoney, parseMoney, subtractMoney } from './money';

describe('money', () => {
  it('parses and adds decimal amounts without floating point', () => {
    const sum = addMoney(parseMoney('0.10'), parseMoney('0.20'));
    expect(formatMoney(sum)).toBe('0.3000');
    expect(sum.equals(new Decimal('0.3'))).toBe(true);
  });

  it('subtracts amounts exactly', () => {
    const result = subtractMoney(parseMoney('20000'), parseMoney('3400.50'));
    expect(formatMoney(result)).toBe('16599.5000');
  });

  it('rejects invalid amounts', () => {
    expect(() => parseMoney('12.34567')).toThrow('Invalid money amount');
    expect(() => parseMoney('abc')).toThrow('Invalid money amount');
  });
});
