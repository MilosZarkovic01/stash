import { parseExpenseText } from './parse-expense';

describe('parseExpenseText', () => {
  it('parses amount and taxi description', () => {
    expect(parseExpenseText('1200 taxi do grada')).toEqual({
      amount: '1200',
      description: 'taxi do grada',
      suggestedSlug: 'taxi',
    });
  });

  it('parses dinner example', () => {
    expect(parseExpenseText('3400 dinner with friends')).toEqual({
      amount: '3400',
      description: 'dinner with friends',
      suggestedSlug: 'eating-out',
    });
  });

  it('returns null amount when missing', () => {
    const parsed = parseExpenseText('coffee');
    expect(parsed.amount).toBeNull();
    expect(parsed.description).toBe('coffee');
  });
});
