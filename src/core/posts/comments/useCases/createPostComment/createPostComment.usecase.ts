import { Injectable } from '@nestjs/common';
import { CommentRepository } from '../../repositories/comment.repository';
import {
  extractDateFromSnowflake,
  generateSnowflakeId,
} from 'src/infrastructure/snowflake/snowflake';
import { Either, ErrorRegister, left, right } from 'src/libs/helpers/either';
import { CreatePostCommentResponseDto } from './dto/create-post-comment.dto';

@Injectable()
export class CreatePostCommentUseCase {
  constructor(private readonly commentRepository: CommentRepository) {}

  async execute(
    userId: bigint,
    postId: bigint,
    text: string,
  ): Promise<Either<ErrorRegister.InputanSalah, CreatePostCommentResponseDto>> {
    try {
      const commentId = generateSnowflakeId();
      const inserted = await this.commentRepository.insertComment({
        id: commentId,
        post_id: postId,
        user_id: userId,
        text: text,
        parent_id: null,
      });

      const commentData = inserted[0]; // AMBIL INDEX PERTAMA

      // Notifikasi ke pemilik post
      const [postData] = await this.commentRepository.getPostById(postId);
      if (postData && postData.user_id !== userId) {
        const [profileData] =
          await this.commentRepository.getProfileByUserId(userId);
        const actorUsername = profileData?.username || 'Seseorang';
        await this.commentRepository.insertNotification({
          id: generateSnowflakeId(),
          user_id: postData.user_id,
          description: `${actorUsername} mengomentari postinganmu`,
          category: 'comment',
        });
      }

      return right({
        id: commentData.id.toString(),
        text: commentData.text,
        createdAt: extractDateFromSnowflake(commentData.id),
        postId: commentData.post_id.toString(),
        userId: commentData.user_id.toString(),
      });
    } catch (error) {
      console.error('Error creating comment:', error);
      return left(new ErrorRegister.InputanSalah('Gagal membuat komentar'));
    }
  }
}
