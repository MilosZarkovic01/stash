import { Inject, Injectable } from '@nestjs/common';
import { IsString, MinLength } from 'class-validator';
import { parseExpenseText } from '../common/parse-expense';
import { PrismaService } from '../database/prisma.service';
import {
  ClassifyResult,
  EXPENSE_CLASSIFIER,
  type ExpenseClassifier,
} from './classifier';

export class ClassifyExpenseDto {
  @IsString()
  @MinLength(1)
  description!: string;
}

export class ParseExpenseDto {
  @IsString()
  @MinLength(1)
  text!: string;
}

@Injectable()
export class AiService {
  constructor(
    @Inject(EXPENSE_CLASSIFIER) private readonly classifier: ExpenseClassifier,
    private readonly prisma: PrismaService,
  ) {}

  async classify(userId: string, description: string): Promise<ClassifyResult> {
    const categories = await this.prisma.category.findMany({
      where: { userId },
    });
    const slugs = categories.map((category) => category.slug);
    try {
      const result = await this.classifier.classify(description, slugs);
      const match = categories.find(
        (category) =>
          category.slug === result.category ||
          category.name.toLowerCase() === result.category.toLowerCase(),
      );
      return {
        category: match?.slug ?? 'other',
        confidence: clampConfidence(result.confidence),
      };
    } catch {
      return { category: 'other', confidence: 0 };
    }
  }

  async parse(userId: string, text: string) {
    const parsed = parseExpenseText(text);
    const classified = await this.classify(userId, parsed.description || text);
    const heuristic =
      parsed.suggestedSlug && classified.confidence < 0.6
        ? parsed.suggestedSlug
        : classified.category;
    const confidence =
      classified.confidence >= 0.6
        ? classified.confidence
        : parsed.suggestedSlug
          ? 0.55
          : classified.confidence;
    return {
      amount: parsed.amount,
      description: parsed.description,
      category: heuristic,
      confidence,
    };
  }
}

function clampConfidence(value: number): number {
  if (Number.isNaN(value)) {
    return 0;
  }
  return Math.min(1, Math.max(0, value));
}
