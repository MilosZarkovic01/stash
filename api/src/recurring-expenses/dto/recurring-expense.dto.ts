import { Currency } from '@prisma/client';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateRecurringExpenseDto {
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name!: string;

  @Matches(/^\d+(\.\d{1,4})?$/)
  amount!: string;

  @IsEnum(Currency)
  currency!: Currency;

  @IsUUID()
  categoryId!: string;

  @IsUUID()
  accountId!: string;

  @IsDateString()
  nextOccurrence!: string;
}

export class UpdateRecurringExpenseDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name?: string;

  @IsOptional()
  @Matches(/^\d+(\.\d{1,4})?$/)
  amount?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsUUID()
  accountId?: string;

  @IsOptional()
  @IsDateString()
  nextOccurrence?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
