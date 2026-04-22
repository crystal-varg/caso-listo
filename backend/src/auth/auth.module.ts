import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { UsersModule } from '../users/users.module';
import { EstudiosModule } from '../estudios/estudios.module';

@Module({
  imports: [
    UsersModule,
    EstudiosModule,
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'caso-listo-secret-dev',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
})
export class AuthModule {}
