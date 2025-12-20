import { Module } from '@nestjs/common';
import { CommentsController } from './comments.controller';
import { CommentRepository } from './repositories/comment.repository';
import { DbModule } from 'src/infrastructure/database/db.module';
import { GetPostCommentsUseCase } from './useCases/getPostComments/getPostComments.usecase';
import { CreatePostCommentUseCase } from './useCases/createPostComment/createPostComment.usecase';
import { DeletePostCommentUseCase } from './useCases/deletePostComment/deletePostComment.usecase';
import { CreateRepliedCommentUseCase } from './useCases/createRepliedComment/createRepliedComment.usecase';
import { DeleteRepliedCommentUseCase } from './useCases/deleteRepliedComment/deleteRepliedComment.usecase';
import { GetRepliedCommentsUseCase } from './useCases/getRepliedComments/getRepliedComments.usecase';

@Module({
  imports: [DbModule],
  controllers: [CommentsController],
  providers: [
    CommentRepository,
    GetPostCommentsUseCase,
    CreatePostCommentUseCase,
    DeletePostCommentUseCase,
    CreateRepliedCommentUseCase,
    DeleteRepliedCommentUseCase,
    GetRepliedCommentsUseCase,
  ],
  exports: [CommentRepository],
})
export class CommentsModule {}
