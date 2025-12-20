import { Injectable } from '@nestjs/common';
import { CommentRepository } from '../../repositories/comment.repository';
import { Either, ErrorRegister, left, right } from 'src/libs/helpers/either';
import { GetRepliedCommentsResponseDto } from './dto/get-replied-comments.dto';
import { extractDateFromSnowflake } from 'src/infrastructure/snowflake/snowflake';

@Injectable()
export class GetRepliedCommentsUseCase {
  constructor(private readonly commentRepository: CommentRepository) {}

  async execute(
    commentId: bigint,
    take: number,
    page: number,
  ): Promise<
    Either<ErrorRegister.InputanSalah, GetRepliedCommentsResponseDto>
  > {
    try {
      const replies = await this.commentRepository.getReplies(
        commentId,
        take,
        page,
      );

      const repliesWithDetails = await Promise.all(
        replies.map(async (r) => {
          const likesCount = await this.commentRepository.countCommentLikes(
            r.id,
          );
          const repliesCount = await this.commentRepository.countReplies(r.id);

          return {
            id: r.id.toString(),
            commentId: r.parent_id?.toString() || '', // TAMBAHKAN INI
            text: r.text,
            postId: r.post_id.toString(),
            userId: r.user_id.toString(),
            createdAt: extractDateFromSnowflake(r.id).toString(),
            user: {
              username: r.username ?? '',
              pictureUrl: r.pictureUrl ?? '',
            },
            summaries: {
              likesCount: Number(likesCount) || 0,
              repliesCount: Number(repliesCount) || 0,
            },
          };
        }),
      );

      const response: GetRepliedCommentsResponseDto = {
        replies: repliesWithDetails,
      };

      return right(response);
    } catch (error) {
      console.error('Error getting replies:', error);
      return left(
        new ErrorRegister.InputanSalah('Gagal mengambil balasan komentar'),
      );
    }
  }
}
