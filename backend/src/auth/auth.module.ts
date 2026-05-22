import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { JwtRefreshStrategy } from './jwt-refresh.strategy';
import { RefreshToken } from './refresh-token.entity';
import { RefreshTokenService } from './refresh-token.service';
import { PasswordReset } from './password-reset.entity';
import { PasswordResetService } from './password-reset.service';
import { UsersModule } from '../users/users.module';
import { EstudiosModule } from '../estudios/estudios.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    UsersModule,
    EstudiosModule,
    MailModule,
    PassportModule,
    TypeOrmModule.forFeature([RefreshToken, PasswordReset]),
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.JWT_SECRET as string,
        // Default override-able por opciones inline en cada jwtService.sign().
        // signAccess() en auth.service.ts pasa ACCESS_TOKEN_JWT_EXPIRES de
        // cookie.config.ts, que es lo que efectivamente gobierna el JWT.
        signOptions: { expiresIn: '7d' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    JwtRefreshStrategy,
    RefreshTokenService,
    PasswordResetService,
  ],
  exports: [AuthService, RefreshTokenService, PasswordResetService],
})
export class AuthModule {}
