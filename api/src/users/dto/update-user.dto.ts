import { Currency } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsEnum(Currency)
  primaryCurrency?: Currency;
}
