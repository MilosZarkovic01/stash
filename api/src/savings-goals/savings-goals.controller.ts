import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import type { AuthUser } from '../common/auth-user';
import { CurrentUser } from '../common/current-user.decorator';
import {
  CreateSavingsGoalDto,
  UpdateSavingsGoalDto,
} from './dto/savings-goal.dto';
import { SavingsGoalsService } from './savings-goals.service';

@Controller('savings-goals')
export class SavingsGoalsController {
  constructor(private readonly goals: SavingsGoalsService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.goals.list(user.id);
  }

  @Get(':id')
  get(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.goals.get(user.id, id);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateSavingsGoalDto) {
    return this.goals.create(user.id, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSavingsGoalDto,
  ) {
    return this.goals.update(user.id, id, dto);
  }

  @Delete(':id')
  remove(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.goals.remove(user.id, id);
  }
}
