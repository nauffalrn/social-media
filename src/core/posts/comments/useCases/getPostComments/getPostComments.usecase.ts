import { Injectable } from '@nestjs/common';
import { CommentRepository } from '../../repositories/comment.repository';
import { Either, ErrorRegister, left, right } from 'src/libs/helpers/either';
import { GetPostCommentsResponseDto } from './dto/get-post-comments.dto';
import { extractDateFromSnowflake } from 'src/infrastructure/snowflake/snowflake';

@Injectable()
export class GetPostCommentsUseCase {
  constructor(private readonly commentRepository: CommentRepository) {}

  async execute(
    postId: bigint,
    take: number,
    page: number,
  ): Promise<Either<ErrorRegister.InputanSalah, GetPostCommentsResponseDto>> {
    try {
      const comments = await this.commentRepository.getPostComments(
        postId,
        take,
        page,
      );

      const commentsWithDetails = await Promise.all(
        comments.map(async (c) => {
          const likesCount = await this.commentRepository.countCommentLikes(
            c.id,
          );
          const repliesCount = await this.commentRepository.countReplies(c.id);

          return {
            id: c.id.toString(),
            text: c.text,
            postId: c.post_id.toString(),
            userId: c.user_id.toString(),
            createdAt: extractDateFromSnowflake(c.id).toString(),
            user: {
              username: c.username ?? '',
              pictureUrl: c.pictureUrl ?? '',
            },
            summaries: {
              likesCount: Number(likesCount) || 0,
              repliesCount: Number(repliesCount) || 0,
            },
          };
        }),
      );

      const response: GetPostCommentsResponseDto = {
        comments: commentsWithDetails,
      };

      return right(response);
    } catch (error) {
      console.error('Error getting post comments:', error);
      return left(new ErrorRegister.InputanSalah('Gagal mengambil komentar'));
    }
  }
}
