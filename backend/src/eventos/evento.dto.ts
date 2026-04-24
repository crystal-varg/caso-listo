import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsInt,
  IsDateString,
  IsEnum,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum TipoEvento {
  AUDIENCIA = 'audiencia',
  VENCIMIENTO = 'vencimiento',
  RECORDATORIO = 'recordatorio',
}

export class CreateEventoDto {
  @IsString() @IsNotEmpty() @MaxLength(200)
  titulo: string;

  @IsOptional() @IsEnum(TipoEvento)
  tipo?: TipoEvento;

  @IsNotEmpty() @IsDateString()
  fecha: string;

  @Type(() => Number) @IsInt() @Min(1)
  consulta_id: number;
}

export class UpdateEventoDto {
  @IsOptional() @IsString() @MaxLength(200)
  titulo?: string;

  @IsOptional() @IsDateString()
  fecha?: string;

  @IsOptional() @IsEnum(TipoEvento)
  tipo?: TipoEvento;

  @IsOptional() @IsBoolean()
  completado?: boolean;
}
