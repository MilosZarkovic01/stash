const KEYWORD_SLUGS: Array<{ pattern: RegExp; slug: string }> = [
  { pattern: /\b(taxi|uber|bolt)\b/i, slug: 'taxi' },
  {
    pattern: /\b(dinner|lunch|restaurant|cafe|eating out)\b/i,
    slug: 'eating-out',
  },
  {
    pattern: /\b(grocery|groceries|supermarket|maxi|lidl)\b/i,
    slug: 'groceries',
  },
  { pattern: /\b(food|lunch ingredients)\b/i, slug: 'food' },
  { pattern: /\b(fuel|gas|petrol|benzinska)\b/i, slug: 'fuel' },
  { pattern: /\b(rent|stanarina)\b/i, slug: 'rent' },
  { pattern: /\b(netflix|spotify|subscription)\b/i, slug: 'subscriptions' },
  { pattern: /\b(bus|train|transport)\b/i, slug: 'transportation' },
  { pattern: /\b(flight|hotel|travel)\b/i, slug: 'travel' },
  { pattern: /\b(movie|cinema|concert)\b/i, slug: 'entertainment' },
  { pattern: /\b(shop|shopping|clothes)\b/i, slug: 'shopping' },
  { pattern: /\b(bill|internet|phone|utility)\b/i, slug: 'bills' },
  { pattern: /\b(loan|kredit)\b/i, slug: 'loan' },
  { pattern: /\b(health|pharmacy|doctor)\b/i, slug: 'health' },
];

export type ParsedExpenseText = {
  amount: string | null;
  description: string;
  suggestedSlug: string | null;
};

export function parseExpenseText(text: string): ParsedExpenseText {
  const trimmed = text.trim();
  const match = trimmed.match(/^(\d+(?:[.,]\d{1,4})?)\s+(.+)$/u);
  const amount = match ? match[1].replace(',', '.') : null;
  const description = match ? match[2].trim() : trimmed;
  return {
    amount,
    description,
    suggestedSlug: suggestSlug(description),
  };
}

function suggestSlug(description: string): string | null {
  for (const item of KEYWORD_SLUGS) {
    if (item.pattern.test(description)) {
      return item.slug;
    }
  }
  return null;
}
