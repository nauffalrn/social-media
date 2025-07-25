import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, isNull, sql } from 'drizzle-orm';
import { DrizzleInstance } from 'src/infrastructure/database';
import {
  comment,
  comment_like,
  comment as commentTable,
  notification,
  post,
  profile,
} from 'src/infrastructure/database/schema';
import {
  extractDateFromSnowflake,
  generateSnowflakeId,
} from 'src/infrastructure/snowflake/snowflake';
import { Either, ErrorRegister, left, right } from 'src/libs/helpers/either';
import { CreatePostCommentResponseDto } from './useCases/createPostComment/dto/create-post-comment-response.dto';
import { CreateRepliedCommentResponseDto } from './useCases/createRepliedComment/dto/create-replied-comment-response.dto';
import { GetPostCommentsResponseDto } from './useCases/getPostComments/dto/get-post-comments-response.dto';
import { GetRepliedCommentsResponseDto } from './useCases/getRepliedComments/dto/get-replied-comments-response.dto';

// Definisi tipe result
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
  constructor(@Inject('DB') private db: DrizzleInstance) {}

  async getPostComments(
    postId: bigint,
    take: number,
    page: number,
  ): Promise<GetPostCommentsResult> {
    try {
      const comments = await this.db
        .select({
          id: comment.id,
          text: comment.text,
          user: {
            username: profile.username,
            pictureUrl: profile.picture_url,
          },
        })
        .from(comment)
        .innerJoin(profile, eq(comment.user_id, profile.user_id))
        .where(and(eq(comment.post_id, postId), isNull(comment.parent_id)))
        .limit(take)
        .offset((page - 1) * take)
        .orderBy(desc(comment.id));

      // mapping comments
      const mappedComments = await Promise.all(
        comments.map(async (c) => {
          // Hitung jumlah likes
          const [{ count: likesCount }] = await this.db
            .select({ count: sql`count(*)` })
            .from(comment_like)
            .where(eq(comment_like.comment_id, c.id));

          // Hitung jumlah replies
          const [{ count: repliesCount }] = await this.db
            .select({ count: sql`count(*)` })
            .from(comment)
            .where(eq(comment.parent_id, c.id));

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
    return await this.db.transaction(async (trx) => {
      try {
        const commentId = generateSnowflakeId();
        const [inserted] = await trx
          .insert(comment)
          .values({
            id: commentId,
            post_id: postId,
            user_id: userId,
            text: text,
            parent_id: null,
          })
          .returning();

        // Notifikasi ke pemilik post
        const [postData] = await trx
          .select()
          .from(post)
          .where(eq(post.id, postId))
          .limit(1);
        if (postData && postData.user_id !== userId) {
          const [profileData] = await trx
            .select()
            .from(profile)
            .where(eq(profile.user_id, userId))
            .limit(1);
          const actorUsername = profileData?.username || 'Seseorang';
          await trx.insert(notification).values({
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
    });
  }

  async deleteComment(
    userId: bigint,
    commentId: bigint,
  ): Promise<DeleteCommentResult> {
    return await this.db.transaction(async (trx) => {
      try {
        const commentToDelete = await trx
          .select()
          .from(comment)
          .where(and(eq(comment.id, commentId), eq(comment.user_id, userId)))
          .limit(1);

        if (commentToDelete.length === 0) {
          return left(
            new ErrorRegister.InputanSalah(
              'Komentar tidak ditemukan atau Anda tidak berhak menghapusnya',
            ),
          );
        }

        await trx.delete(comment).where(eq(comment.id, commentId));

        return right(undefined);
      } catch (error) {
        console.error('Error deleting comment:', error);
        return left(new ErrorRegister.InputanSalah('Gagal menghapus komentar'));
      }
    });
  }

  async getReplies(
    commentId: bigint,
    take: number,
    page: number,
  ): Promise<GetRepliesResult> {
    try {
      const replies = await this.db
        .select({
          id: comment.id,
          text: comment.text,
          user: {
            username: profile.username,
            pictureUrl: profile.picture_url,
          },
        })
        .from(comment)
        .innerJoin(profile, eq(comment.user_id, profile.user_id))
        .where(eq(comment.parent_id, commentId))
        .limit(take)
        .offset((page - 1) * take)
        .orderBy(desc(comment.id));

      // mapping replies
      const mappedReplies = await Promise.all(
        replies.map(async (r) => {
          // Hitung jumlah likes
          const [{ count: likesCount }] = await this.db
            .select({ count: sql`count(*)` })
            .from(comment_like)
            .where(eq(comment_like.comment_id, r.id));

          // Hitung jumlah replies
          const [{ count: repliesCount }] = await this.db
            .select({ count: sql`count(*)` })
            .from(comment)
            .where(eq(comment.parent_id, r.id));

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
    return await this.db.transaction(async (trx) => {
      try {
        const replyId = generateSnowflakeId();
        const [inserted] = await trx
          .insert(comment)
          .values({
            id: replyId,
            post_id: postId,
            user_id: userId,
            text: text,
            parent_id: commentId,
          })
          .returning();

        // Notifikasi ke pemilik komentar
        const [commentData] = await trx
          .select()
          .from(commentTable)
          .where(eq(commentTable.id, commentId))
          .limit(1);
        if (commentData && commentData.user_id !== userId) {
          const [profileData] = await trx
            .select()
            .from(profile)
            .where(eq(profile.user_id, userId))
            .limit(1);
          const actorUsername = profileData?.username || 'Seseorang';
          await trx.insert(notification).values({
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
    });
  }

  async deleteReply(
    userId: bigint,
    replyId: bigint,
  ): Promise<DeleteReplyResult> {
    return await this.db.transaction(async (trx) => {
      try {
        const replyToDelete = await trx
          .select()
          .from(comment)
          .where(and(eq(comment.id, replyId), eq(comment.user_id, userId)))
          .limit(1);

        if (replyToDelete.length === 0) {
          return left(
            new ErrorRegister.InputanSalah(
              'Balasan komentar tidak ditemukan atau Anda tidak berhak menghapusnya',
            ),
          );
        }

        await trx.delete(comment).where(eq(comment.id, replyId));

        return right(undefined);
      } catch (error) {
        console.error('Error deleting reply:', error);
        return left(
          new ErrorRegister.InputanSalah('Gagal menghapus balasan komentar'),
        );
      }
    });
  }
}
