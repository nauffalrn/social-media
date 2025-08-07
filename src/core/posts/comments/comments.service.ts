import { Injectable } from '@nestjs/common';
import {
  extractDateFromSnowflake,
  generateSnowflakeId,
} from 'src/infrastructure/snowflake/snowflake';
import { Either, ErrorRegister, left, right } from 'src/libs/helpers/either';
import { CommentRepository } from './repositories/comment.repository';
import { CreatePostCommentResponseDto } from './useCases/createPostComment/dto/create-post-comment-response.dto';
import { CreateRepliedCommentResponseDto } from './useCases/createRepliedComment/dto/create-replied-comment-response.dto';
import { GetPostCommentsResponseDto } from './useCases/getPostComments/dto/get-post-comments-response.dto';
import { GetRepliedCommentsResponseDto } from './useCases/getRepliedComments/dto/get-replied-comments-response.dto';

type GetPostCommentsResult = Either<
  ErrorRegister.InputanSalah,
  GetPostCommentsResponseDto
>;
type CreateCommentResult = Either<
  ErrorRegister.InputanSalah,
  CreatePostCommentResponseDto
>;
type DeleteCommentResult = Either<ErrorRegister.InputanSalah, void>;
type GetRepliesResult = Either<
  ErrorRegister.InputanSalah,
  GetRepliedCommentsResponseDto
>;
type CreateReplyResult = Either<
  ErrorRegister.InputanSalah,
  CreateRepliedCommentResponseDto
>;
type DeleteReplyResult = Either<ErrorRegister.InputanSalah, void>;

@Injectable()
export class CommentsService {
  constructor(private readonly commentRepository: CommentRepository) {}

  async getPostComments(
    postId: bigint,
    take: number,
    page: number,
  ): Promise<GetPostCommentsResult> {
    try {
      const comments = await this.commentRepository.getPostComments(
        postId,
        take,
        page,
      );

      // mapping comments
      const mappedComments = await Promise.all(
        comments.map(async (c) => {
          // Hitung jumlah likes
          const likesCount = await this.commentRepository.countCommentLikes(
            c.id,
          );

          // Hitung jumlah replies
          const repliesCount = await this.commentRepository.countReplies(c.id);

          return {
            id: c.id.toString(),
            text: c.text,
            createdAt: extractDateFromSnowflake(c.id).toString(),
            user: {
              username: c.user.username ?? '',
              pictureUrl: c.user.pictureUrl ?? '',
            },
            summaries: {
              likesCount: Number(likesCount) || 0,
              repliesCount: Number(repliesCount) || 0,
            },
          };
        }),
      );

      const response: GetPostCommentsResponseDto = {
        comments: mappedComments,
      };

      return right(response);
    } catch (error) {
      console.error('Error getting post comments:', error);
      return left(new ErrorRegister.InputanSalah('Gagal mengambil komentar'));
    }
  }

  async createComment(
    userId: bigint,
    postId: bigint,
    text: string,
  ): Promise<CreateCommentResult> {
    try {
      const commentId = generateSnowflakeId();
      const inserted = await this.commentRepository.insertComment({
        id: commentId,
        post_id: postId,
        user_id: userId,
        text: text,
        parent_id: null,
      });

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
        id: inserted.id.toString(),
        text: inserted.text,
        createdAt: extractDateFromSnowflake(inserted.id),
        postId: inserted.post_id.toString(),
        userId: inserted.user_id.toString(),
      });
    } catch (error) {
      console.error('Error creating comment:', error);
      return left(new ErrorRegister.InputanSalah('Gagal membuat komentar'));
    }
  }

  async deleteComment(
    userId: bigint,
    commentId: bigint,
  ): Promise<DeleteCommentResult> {
    // Ambil comment
    const [commentData] =
      await this.commentRepository.findCommentById(commentId);

    if (!commentData) {
      return left(new ErrorRegister.InputanSalah('Komentar tidak ditemukan'));
    }

    // Hapus comment
    await this.commentRepository.deleteComment(commentId);

    // Hapus notifikasi comment
    const [profileData] =
      await this.commentRepository.getProfileByUserId(userId);
    const actorUsername = profileData?.username || 'Seseorang';
    await this.commentRepository.deleteNotification(
      commentData.user_id,
      `${actorUsername} mengomentari postinganmu`,
    );

    return right(undefined);
  }

  async getReplies(
    commentId: bigint,
    take: number,
    page: number,
  ): Promise<GetRepliesResult> {
    try {
      const replies = await this.commentRepository.getReplies(
        commentId,
        take,
        page,
      );

      // mapping replies
      const mappedReplies = await Promise.all(
        replies.map(async (r) => {
          // Hitung jumlah likes
          const likesCount = await this.commentRepository.countCommentLikes(
            r.id,
          );

          // Hitung jumlah replies
          const repliesCount = await this.commentRepository.countReplies(r.id);

          return {
            id: r.id.toString(),
            commentId: commentId.toString(),
            text: r.text,
            createdAt: extractDateFromSnowflake(r.id).toString(),
            user: {
              username: r.user.username ?? '',
              pictureUrl: r.user.pictureUrl ?? '',
            },
            summaries: {
              likesCount: Number(likesCount) || 0,
              repliesCount: Number(repliesCount) || 0,
            },
          };
        }),
      );

      const response: GetRepliedCommentsResponseDto = {
        replies: mappedReplies,
      };

      return right(response);
    } catch (error) {
      console.error('Error getting replies:', error);
      return left(
        new ErrorRegister.InputanSalah('Gagal mengambil balasan komentar'),
      );
    }
  }

  async createReply(
    userId: bigint,
    postId: bigint,
    commentId: bigint,
    text: string,
  ): Promise<CreateReplyResult> {
    try {
      const replyId = generateSnowflakeId();
      const inserted = await this.commentRepository.insertComment({
        id: replyId,
        post_id: postId,
        user_id: userId,
        text: text,
        parent_id: commentId,
      });

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
        id: inserted.id.toString(),
        text: inserted.text,
        createdAt: extractDateFromSnowflake(inserted.id),
        postId: inserted.post_id.toString(),
        userId: inserted.user_id.toString(),
      };

      return right(response);
    } catch (error) {
      console.error('Error creating reply:', error);
      return left(
        new ErrorRegister.InputanSalah('Gagal membuat balasan komentar'),
      );
    }
  }

  async deleteReply(
    userId: bigint,
    replyId: bigint,
  ): Promise<DeleteReplyResult> {
    // Ambil reply
    const [replyData] = await this.commentRepository.findCommentById(replyId);

    if (!replyData) {
      return left(new ErrorRegister.InputanSalah('Reply tidak ditemukan'));
    }

    // Hapus reply
    await this.commentRepository.deleteComment(replyId);

    // Hapus notifikasi reply
    const [profileData] =
      await this.commentRepository.getProfileByUserId(userId);
    const actorUsername = profileData?.username || 'Seseorang';
    await this.commentRepository.deleteNotification(
      replyData.user_id,
      `${actorUsername} membalas komentarmu`,
    );

    return right(undefined);
  }
}
