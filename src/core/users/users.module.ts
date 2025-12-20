import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { DbModule } from 'src/infrastructure/database/db.module';
import { UploadsModule } from 'src/infrastructure/storage/uploads.module'; // TAMBAHKAN INI
import { EmailService } from '../../infrastructure/email/email.service';
import { FollowRepository } from '../follows/repositories/follow.repository';
import { UserRepository } from './repositories/user.repository';
import { GetProfileUseCase } from './useCases/checkProfile/get-profile.usecase';
import { SignInUseCase } from './useCases/signIn/sign-in.usecase';
import { SignUpUseCase } from './useCases/signUp/sign-up.usecase';
import { UpdateProfileUseCase } from './useCases/updateProfile/update-profile.usecase';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [DbModule, HttpModule, JwtModule, UploadsModule],
  controllers: [UsersController],
  providers: [
    UsersService,
    UserRepository,
    FollowRepository,
    EmailService,
    SignUpUseCase,
    SignInUseCase,
    GetProfileUseCase,
    UpdateProfileUseCase,
  ],
  exports: [UsersService, UserRepository],
})
export class UsersModule {}
