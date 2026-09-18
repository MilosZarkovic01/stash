import { addUtcMonths, remainingDaysInUtcMonth, utcDateOnly } from './dates';

describe('dates', () => {
  it('counts remaining days inclusive on the last day of the month', () => {
    expect(remainingDaysInUtcMonth(new Date(Date.UTC(2026, 8, 30)))).toBe(1);
  });

  it('counts remaining days at the start of a 30-day month', () => {
    expect(remainingDaysInUtcMonth(new Date(Date.UTC(2026, 8, 1)))).toBe(30);
  });

  it('clamps day when adding a month from Jan 31', () => {
    expect(addUtcMonths(new Date(Date.UTC(2026, 0, 31)), 1).toISOString()).toBe(
      '2026-02-28T00:00:00.000Z',
    );
  });

  it('parses ISO date as UTC midnight', () => {
    expect(utcDateOnly('2026-09-18').toISOString()).toBe(
      '2026-09-18T00:00:00.000Z',
    );
  });
});
