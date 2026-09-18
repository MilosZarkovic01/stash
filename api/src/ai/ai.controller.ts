import { Body, Controller, Post } from '@nestjs/common';
import type { AuthUser } from '../common/auth-user';
import { CurrentUser } from '../common/current-user.decorator';
import { AiService, ClassifyExpenseDto, ParseExpenseDto } from './ai.service';

@Controller('ai')
export class AiController {
  constructor(private readonly ai: AiService) {}

  @Post('classify')
  classify(@CurrentUser() user: AuthUser, @Body() dto: ClassifyExpenseDto) {
    return this.ai.classify(user.id, dto.description);
  }

  @Post('parse-expense')
  parse(@CurrentUser() user: AuthUser, @Body() dto: ParseExpenseDto) {
    return this.ai.parse(user.id, dto.text);
  }
}
