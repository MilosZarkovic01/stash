export function displayMoney(value: string, currency: string): string {
  const trimmed = value.replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
  return `${trimmed} ${currency}`;
}

export function todayIsoDate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
