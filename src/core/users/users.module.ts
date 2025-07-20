import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmailService } from '../../infrastructure/email/email.service';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UploadsModule } from 'src/infrastructure/storage/uploads.module';

@Module({
  imports: [ConfigModule, HttpModule, UploadsModule],
  controllers: [UsersController],
  providers: [UsersService, EmailService],
  exports: [UsersService, EmailService],
})
export class UsersModule {}
