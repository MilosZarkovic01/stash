import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { EXPENSE_CLASSIFIER } from './classifier';
import { HttpExpenseClassifier } from './http-classifier';
import { StubExpenseClassifier } from './stub-classifier';

@Module({
  controllers: [AiController],
  providers: [
    AiService,
    {
      provide: EXPENSE_CLASSIFIER,
      useFactory: () => {
        const url = process.env.AI_CLASSIFY_URL;
        if (url) {
          return new HttpExpenseClassifier(url);
        }
        return new StubExpenseClassifier();
      },
    },
  ],
})
export class AiModule {}
