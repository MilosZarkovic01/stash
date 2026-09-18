import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return {
      id: user.id,
      email: user.email,
      emailVerified: Boolean(user.emailVerifiedAt),
      primaryCurrency: user.primaryCurrency,
      hasApple: Boolean(user.appleUserId),
    };
  }

  async updateMe(userId: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        primaryCurrency: dto.primaryCurrency,
      },
    });
    return {
      id: user.id,
      email: user.email,
      emailVerified: Boolean(user.emailVerifiedAt),
      primaryCurrency: user.primaryCurrency,
      hasApple: Boolean(user.appleUserId),
    };
  }
}
