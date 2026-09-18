import { ClassifyResult, ExpenseClassifier } from './classifier';

export class StubExpenseClassifier implements ExpenseClassifier {
  classify(): Promise<ClassifyResult> {
    return Promise.resolve({ category: 'other', confidence: 0.1 });
  }
}
