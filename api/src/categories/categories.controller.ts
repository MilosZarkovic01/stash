import {
  Controller,
  Get,
  Param,
  Patch,
  Body,
  ParseUUIDPipe,
} from '@nestjs/common';
import { CurrentUser } from '../common/current-user.decorator';
import type { AuthUser } from '../common/auth-user';
import { CategoriesService, UpdateCategoryDto } from './categories.service';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.categories.list(user.id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.categories.update(user.id, id, dto);
  }
}
