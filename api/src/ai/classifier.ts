export type ClassifyResult = {
  category: string;
  confidence: number;
};

export interface ExpenseClassifier {
  classify(description: string, slugs: string[]): Promise<ClassifyResult>;
}

export const EXPENSE_CLASSIFIER = 'EXPENSE_CLASSIFIER';
