import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ConsultasModule } from './consultas/consultas.module';
import { EstudiosModule } from './estudios/estudios.module';
import { AdminModule } from './admin/admin.module';
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
import { RefreshToken } from './auth/refresh-token.entity';
import { PasswordReset } from './auth/password-reset.entity';

const isProd = process.env.NODE_ENV === 'production';

function getDbConfig() {
  if (process.env.DATABASE_URL) {
    return {
      url: process.env.DATABASE_URL,
      ssl: isProd ? { rejectUnauthorized: false } : false,
    };
  }
  return {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
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
      entities: [
        Usuario,
        Consulta,
        Estudio,
        Honorario,
        Actividad,
        Evento,
        Notificacion,
        RefreshToken,
        PasswordReset,
      ],
      synchronize: true,
      logging: false,
    }),
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60 * 1000, // 60 segundos
        limit: 20,
      },
    ]),
    AuthModule,
    UsersModule,
    ConsultasModule,
    EstudiosModule,
    AdminModule,
    MailModule,
    HonorariosModule,
    ActividadModule,
    EventosModule,
    NotificacionesModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
