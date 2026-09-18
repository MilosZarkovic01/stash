import { Currency } from '@prisma/client';
import {
  IsEnum,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateAccountDto {
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name!: string;

  @IsEnum(Currency)
  currency!: Currency;

  @Matches(/^\d+(\.\d{1,4})?$/)
  initialBalance!: string;
}

export class UpdateAccountDto {
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name!: string;
}
