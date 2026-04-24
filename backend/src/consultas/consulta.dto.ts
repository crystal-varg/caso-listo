import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsEnum,
  MaxLength,
  MinLength,
  Matches,
} from 'class-validator';
import {
  EstadoConsulta,
  FueroConsulta,
  UrgenciaConsulta,
} from './consulta.entity';

/**
 * DTOs are treated as a declarative security contract. `whitelist: true` drops
 * any field not listed here, and `forbidNonWhitelisted: true` rejects the whole
 * request if an unknown field is sent.
 *
 * Every string has an explicit `@MaxLength`. Never trust that the DB column
 * length will protect you — class-validator runs first and produces a proper
 * 400, while the DB would throw a 500.
 */
export class CreateConsultaDto {
  @IsString() @IsNotEmpty() @MinLength(2) @MaxLength(120)
  nombre_cliente: string;

  @IsEmail() @MaxLength(254)
  email: string;

  @IsOptional() @IsString() @MaxLength(32)
  @Matches(/^[0-9+()\-\s.]{0,32}$/, { message: 'Teléfono con caracteres no permitidos.' })
  telefono?: string;

  @IsString() @IsNotEmpty() @MinLength(10) @MaxLength(4000)
  mensaje: string;

  @IsOptional() @IsString() @MaxLength(80)
  tipo_caso?: string;

  @IsOptional() @IsEnum(UrgenciaConsulta)
  urgencia?: UrgenciaConsulta;

  @IsOptional() @IsString() @Matches(/^\d{4}-\d{2}-\d{2}$/)
  fecha_preferida?: string;

  @IsOptional() @IsString() @MaxLength(16)
  horario_preferido?: string;

  @IsOptional() @IsString() @MaxLength(16)
  dni_estado?: string;

  @IsOptional() @IsString() @MaxLength(16)
  docs_estado?: string;
}

export class UpdateConsultaDto {
  @IsOptional() @IsEnum(EstadoConsulta)
  estado?: EstadoConsulta;

  @IsOptional() @IsEnum(FueroConsulta)
  fuero?: FueroConsulta;

  @IsOptional() @IsString() @MaxLength(80)
  tipo_caso?: string;
}
