export function utcDateOnly(value: string | Date): Date {
  if (value instanceof Date) {
    return new Date(
      Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()),
    );
  }
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) {
    throw new Error('Invalid date');
  }
  return new Date(
    Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])),
  );
}

export function startOfUtcMonth(year: number, month: number): Date {
  return new Date(Date.UTC(year, month - 1, 1));
}

export function endOfUtcMonth(year: number, month: number): Date {
  return new Date(Date.UTC(year, month, 0));
}

export function remainingDaysInUtcMonth(today: Date): number {
  const year = today.getUTCFullYear();
  const month = today.getUTCMonth();
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const remaining = lastDay - today.getUTCDate() + 1;
  return Math.max(remaining, 1);
}

export function addUtcMonths(date: Date, months: number): Date {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();
  const lastDayOfTarget = new Date(
    Date.UTC(year, month + months + 1, 0),
  ).getUTCDate();
  return new Date(
    Date.UTC(year, month + months, Math.min(day, lastDayOfTarget)),
  );
}

export function isSameUtcMonth(
  date: Date,
  year: number,
  month: number,
): boolean {
  return date.getUTCFullYear() === year && date.getUTCMonth() + 1 === month;
}
