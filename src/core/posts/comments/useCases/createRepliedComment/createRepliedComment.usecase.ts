import { Injectable } from '@nestjs/common';
import { CommentRepository } from '../../repositories/comment.repository';
import { Either, ErrorRegister, left, right } from 'src/libs/helpers/either';
import { CreateRepliedCommentResponseDto } from './dto/create-replied-comment.dto';
import {
  extractDateFromSnowflake,
  generateSnowflakeId,
} from 'src/infrastructure/snowflake/snowflake';

@Injectable()
export class CreateRepliedCommentUseCase {
  constructor(private readonly commentRepository: CommentRepository) {}

  async execute(
    userId: bigint,
    postId: bigint,
    commentId: bigint,
    text: string,
  ): Promise<
    Either<ErrorRegister.InputanSalah, CreateRepliedCommentResponseDto>
  > {
    try {
      const replyId = generateSnowflakeId();
      const inserted = await this.commentRepository.insertComment({
        id: replyId,
        post_id: postId,
        user_id: userId,
        text: text,
        parent_id: commentId,
      });

      const replyData = inserted[0]; // AMBIL INDEX PERTAMA

      // Notifikasi ke pemilik komentar
      const [commentData] =
        await this.commentRepository.findCommentById(commentId);
      if (commentData && commentData.user_id !== userId) {
        const [profileData] =
          await this.commentRepository.getProfileByUserId(userId);
        const actorUsername = profileData?.username || 'Seseorang';
        await this.commentRepository.insertNotification({
          id: generateSnowflakeId(),
          user_id: commentData.user_id,
          description: `${actorUsername} membalas komentarmu`,
          category: 'reply',
        });
      }

      const response: CreateRepliedCommentResponseDto = {
        id: replyData.id.toString(),
        text: replyData.text,
        createdAt: extractDateFromSnowflake(replyData.id),
        postId: replyData.post_id.toString(),
        userId: replyData.user_id.toString(),
      };

      return right(response);
    } catch (error) {
      console.error('Error creating reply:', error);
      return left(
        new ErrorRegister.InputanSalah('Gagal membuat balasan komentar'),
      );
    }
  }
}
