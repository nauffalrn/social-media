import { Module } from '@nestjs/common';
import { DbModule } from 'src/infrastructure/database/db.module';
import { UploadsModule } from 'src/infrastructure/storage/uploads.module';
import { FollowsModule } from '../follows/follows.module';
import { UsersModule } from '../users/users.module';
import { CommentsModule } from './comments/comments.module';
import { LikesModule } from './likes/likes.module';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';

@Module({
  imports: [
    UsersModule,
    FollowsModule,
    UploadsModule,
    CommentsModule,
    LikesModule,
    DbModule,
  ],
  controllers: [PostsController],
  providers: [PostsService],
  exports: [PostsService],
})
export class PostsModule {}
