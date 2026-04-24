import {
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_MONTO = 1_000_000_000;

export class CreateHonorarioDto {
  @Type(() => Number) @IsNumber() @IsPositive() @Max(MAX_MONTO)
  monto_total: number;

  @Type(() => Number) @IsOptional() @IsNumber() @Min(0) @Max(MAX_MONTO)
  monto_pagado?: number;

  @IsString() @Matches(ISO_DATE, { message: 'Formato fecha inválido (YYYY-MM-DD).' })
  fecha_vencimiento: string;

  @Type(() => Number) @IsInt() @Min(1)
  consulta_id: number;
}

export class UpdateHonorarioDto {
  @Type(() => Number) @IsOptional() @IsNumber() @Min(0) @Max(MAX_MONTO)
  monto_pagado?: number;

  @Type(() => Number) @IsOptional() @IsNumber() @IsPositive() @Max(MAX_MONTO)
  monto_total?: number;

  @IsOptional() @IsString() @Matches(ISO_DATE)
  fecha_vencimiento?: string;
}
