import { ClassifyResult, ExpenseClassifier } from './classifier';

export class HttpExpenseClassifier implements ExpenseClassifier {
  constructor(private readonly url: string) {}

  async classify(
    description: string,
    slugs: string[],
  ): Promise<ClassifyResult> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    try {
      const response = await fetch(this.url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ description, categories: slugs }),
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new Error('Classifier HTTP error');
      }
      const body = (await response.json()) as {
        category?: string;
        confidence?: number;
      };
      const category =
        typeof body.category === 'string' ? body.category : 'other';
      const confidence =
        typeof body.confidence === 'number' ? body.confidence : 0;
      return { category, confidence };
    } finally {
      clearTimeout(timer);
    }
  }
}
