import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ConsultasModule } from './consultas/consultas.module';
import { EstudiosModule } from './estudios/estudios.module';
import { MailModule } from './mail/mail.module';
import { HonorariosModule } from './honorarios/honorarios.module';
import { ActividadModule } from './actividad/actividad.module';
import { EventosModule } from './eventos/eventos.module';
import { NotificacionesModule } from './notificaciones/notificaciones.module';
import { Usuario } from './users/usuario.entity';
import { Consulta } from './consultas/consulta.entity';
import { Estudio } from './estudios/estudio.entity';
import { Honorario } from './honorarios/honorario.entity';
import { Actividad } from './actividad/actividad.entity';
import { Evento } from './eventos/evento.entity';
import { Notificacion } from './notificaciones/notificacion.entity';

const isProd = process.env.NODE_ENV === 'production';

// Railway provee DATABASE_URL automáticamente.
// En dev usamos variables individuales como fallback.
function getDbConfig() {
  if (process.env.DATABASE_URL) {
    return {
      url: process.env.DATABASE_URL,
      ssl: isProd ? { rejectUnauthorized: false } : false,
    };
  }
  return {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASS || 'postgres',
    database: process.env.DB_NAME || 'caso_listo',
    ssl: false,
  };
}

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      ...getDbConfig(),
      entities: [Usuario, Consulta, Estudio, Honorario, Actividad, Evento, Notificacion],
      synchronize: true, // Railway crea las tablas al primer deploy
      logging: false,
    }),
    AuthModule,
    UsersModule,
    ConsultasModule,
    EstudiosModule,
    MailModule,
    HonorariosModule,
    ActividadModule,
    EventosModule,
    NotificacionesModule,
  ],
})
export class AppModule {}
