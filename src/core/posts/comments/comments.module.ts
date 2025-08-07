import { Module } from '@nestjs/common';
import { DbModule } from 'src/infrastructure/database/db.module';
import { CommentsController } from './comments.controller';
import { CommentRepository } from './repositories/comment.repository';
import { CommentsService } from './comments.service';

@Module({
  imports: [DbModule],
  controllers: [CommentsController],
  providers: [CommentsService, CommentRepository],
  exports: [CommentsService, CommentRepository],
})
export class CommentsModule {}
