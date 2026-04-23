import { IsNumber, IsOptional, IsPositive, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateHonorarioDto {
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  monto_total: number;

  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0)
  monto_pagado?: number;

  @IsString()
  fecha_vencimiento: string;

  @Type(() => Number)
  @IsNumber()
  consulta_id: number;
}

export class UpdateHonorarioDto {
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0)
  monto_pagado?: number;

  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @IsPositive()
  monto_total?: number;

  @IsOptional()
  @IsString()
  fecha_vencimiento?: string;
}
