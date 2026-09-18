import { Module } from '@nestjs/common';
import { SavingsGoalsModule } from '../savings-goals/savings-goals.module';
import { InsightsController } from './insights.controller';
import { InsightsService } from './insights.service';

@Module({
  imports: [SavingsGoalsModule],
  controllers: [InsightsController],
  providers: [InsightsService],
})
export class InsightsModule {}
