import { Controller, Get, Query } from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import type { AuthUser } from '../common/auth-user';
import { CurrentUser } from '../common/current-user.decorator';
import { InsightsService } from './insights.service';

class InsightsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(2100)
  year?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  month?: number;
}

@Controller('insights')
export class InsightsController {
  constructor(private readonly insights: InsightsService) {}

  @Get('status')
  status(@CurrentUser() user: AuthUser) {
    return this.insights.status(user.id);
  }

  @Get()
  analytics(@CurrentUser() user: AuthUser, @Query() query: InsightsQueryDto) {
    const now = new Date();
    const year = query.year ?? now.getUTCFullYear();
    const month = query.month ?? now.getUTCMonth() + 1;
    return this.insights.analytics(user.id, year, month);
  }
}
