import { Module } from '@nestjs/common';
import { FollowsModule } from '../follows/follows.module';
import { UsersModule } from '../users/users.module';
import { CommentsModule } from './comments/comments.module';
import { LikesModule } from './likes/likes.module';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { UploadsModule } from 'src/infrastructure/storage/uploads.module';

@Module({
  imports: [UsersModule, FollowsModule, UploadsModule, CommentsModule, LikesModule],
  controllers: [PostsController],
  providers: [PostsService],
  exports: [PostsService],
})
export class PostsModule {}
