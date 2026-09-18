import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { Public } from './auth.decorators';
import { PrismaService } from '../database/prisma.service';

@Public()
@Controller()
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('health')
  async health(): Promise<{ status: string }> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok' };
    } catch {
      throw new ServiceUnavailableException({ status: 'error' });
    }
  }
}
