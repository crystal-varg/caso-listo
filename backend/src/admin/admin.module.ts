import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { EstudiosModule } from '../estudios/estudios.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [UsersModule, EstudiosModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
