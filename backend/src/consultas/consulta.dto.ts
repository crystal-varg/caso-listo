import { IsEmail, IsNotEmpty, IsOptional, IsString, IsEnum } from 'class-validator';
import { EstadoConsulta, FueroConsulta } from './consulta.entity';

export class CreateConsultaDto {
  @IsNotEmpty({ message: 'El nombre es requerido' })
  @IsString()
  nombre_cliente: string;

  @IsEmail({}, { message: 'Email inválido' })
  email: string;

  @IsOptional()
  @IsString()
  telefono?: string;

  @IsNotEmpty({ message: 'El mensaje es requerido' })
  @IsString()
  mensaje: string;

  @IsOptional()
  @IsString()
  tipo_caso?: string;

  @IsOptional()
  @IsString()
  urgencia?: string;

  @IsOptional()
  @IsString()
  fecha_preferida?: string;

  @IsOptional()
  @IsString()
  horario_preferido?: string;
}

export class UpdateConsultaDto {
  @IsOptional()
  @IsEnum(EstadoConsulta)
  estado?: EstadoConsulta;

  @IsOptional()
  @IsEnum(FueroConsulta)
  fuero?: FueroConsulta;

  @IsOptional()
  @IsString()
  tipo_caso?: string;
}
