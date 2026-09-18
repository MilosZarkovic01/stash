import { Currency, TransactionType } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateTransactionDto {
  @IsEnum(TransactionType)
  type!: TransactionType;

  @Matches(/^\d+(\.\d{1,4})?$/)
  amount!: string;

  @IsEnum(Currency)
  currency!: Currency;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  description!: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsUUID()
  accountId!: string;

  @IsOptional()
  @IsUUID()
  destinationAccountId?: string;

  @IsDateString()
  transactionDate!: string;
}

export class UpdateTransactionDto {
  @IsOptional()
  @IsEnum(TransactionType)
  type?: TransactionType;

  @IsOptional()
  @Matches(/^\d+(\.\d{1,4})?$/)
  amount?: string;

  @IsOptional()
  @IsEnum(Currency)
  currency?: Currency;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  description?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string | null;

  @IsOptional()
  @IsUUID()
  accountId?: string;

  @IsOptional()
  @IsUUID()
  destinationAccountId?: string | null;

  @IsOptional()
  @IsDateString()
  transactionDate?: string;
}
