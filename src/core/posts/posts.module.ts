import { Module } from '@nestjs/common';
import { DbModule } from 'src/infrastructure/database/db.module';
import { UploadsModule } from 'src/infrastructure/storage/uploads.module';
import { UsersModule } from '../users/users.module';
import { PostsController } from './posts.controller';
import { PostRepository } from './repositories/post.repository';
import { CreatePostUseCase } from './useCases/createPost/createPost.usecase';
import { SearchPostUseCase } from './useCases/searchPost/searchPost.usecase';
import { TaggedPostUseCase } from './useCases/taggedPost/taggedPost.usecase';

@Module({
  imports: [DbModule, UploadsModule, UsersModule],
  controllers: [PostsController],
  providers: [
    PostRepository,
    CreatePostUseCase,
    SearchPostUseCase,
    TaggedPostUseCase,
  ],
  exports: [PostRepository],
})
export class PostsModule {}
  