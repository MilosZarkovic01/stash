import { Injectable, NotFoundException } from '@nestjs/common';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { PrismaService } from '../database/prisma.service';
import { DEFAULT_CATEGORIES } from './default-categories';

export class UpdateCategoryDto {
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  @IsOptional()
  name?: string;
}

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async seedDefaults(userId: string): Promise<void> {
    await this.prisma.category.createMany({
      data: DEFAULT_CATEGORIES.map((category) => ({
        userId,
        name: category.name,
        slug: category.slug,
      })),
      skipDuplicates: true,
    });
  }

  list(userId: string) {
    return this.prisma.category.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
    });
  }

  async update(userId: string, id: string, dto: UpdateCategoryDto) {
    const existing = await this.prisma.category.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      throw new NotFoundException('Category not found');
    }
    return this.prisma.category.update({
      where: { id },
      data: { name: dto.name ?? existing.name },
    });
  }
}
