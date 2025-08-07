import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DbModule } from 'src/infrastructure/database/db.module';
import { UploadsModule } from 'src/infrastructure/storage/uploads.module';
import { EmailService } from '../../infrastructure/email/email.service';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UserRepository } from './repositories/user.repository';
import { FollowRepository } from '../follows/repositories/follow.repository';

@Module({
  imports: [ConfigModule, HttpModule, UploadsModule, DbModule],
  controllers: [UsersController],
  providers: [UsersService, EmailService, UserRepository, FollowRepository],
  exports: [UsersService, EmailService, UserRepository, FollowRepository],
})
export class UsersModule {}
