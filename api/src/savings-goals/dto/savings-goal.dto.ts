import { Currency } from '@prisma/client';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateSavingsGoalDto {
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name!: string;

  @IsEnum(Currency)
  currency!: Currency;

  @Matches(/^\d+(\.\d{1,4})?$/)
  target!: string;

  @IsInt()
  @Min(2000)
  @Max(2100)
  year!: number;

  @IsInt()
  @Min(1)
  @Max(12)
  month!: number;
}

export class UpdateSavingsGoalDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name?: string;

  @IsOptional()
  @Matches(/^\d+(\.\d{1,4})?$/)
  target?: string;
}
