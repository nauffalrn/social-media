import { Module } from '@nestjs/common';
import { FollowsController } from './follows.controller';
import { FollowRepository } from './repositories/follow.repository';
import { DbModule } from 'src/infrastructure/database/db.module';
import { UsersModule } from '../users/users.module'; // IMPORT UsersModule
import { GetFollowingsUseCase } from './useCases/checkFollowings/get-followings.usecase';
import { FollowUserUseCase } from './useCases/followUser/following.usecase';
import { UnfollowUserUseCase } from './useCases/unfollowUser/unfollowing.usecase';
import { GetFollowersUseCase } from './useCases/checkFollowers/get-followers.usecase';

@Module({
  imports: [DbModule, UsersModule],
  controllers: [FollowsController],
  providers: [
    FollowRepository,
    GetFollowingsUseCase,
    FollowUserUseCase,
    UnfollowUserUseCase,
    GetFollowersUseCase,
  ],
  exports: [FollowRepository],
})
export class FollowsModule {}
