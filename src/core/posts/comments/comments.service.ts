import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, isNull } from 'drizzle-orm';
import { DrizzleInstance } from 'src/infrastructure/database';
import {
  comment,
  comment as commentTable,
  notification,
  post,
  profile,
} from 'src/infrastructure/database/schema'; // Tambahkan import
import {
  extractDateFromSnowflake,
  generateSnowflakeId,
} from 'src/infrastructure/snowflake/snowflake';
import { Either, ErrorRegister, left, right } from 'src/libs/helpers/either';

// Definisi tipe untuk nilai return
interface CommentOutput {
  id: string;
  text: string;
  createdAt: Date;
  user: {
    username: string;
    pictureUrl: string | null;
  };
  summaries: {
    likesCount: number;
    repliesCount: number;
  };
}

interface ReplyOutput {
  id: string;
  text: string;
  createdAt: Date;
  user: {
    username: string;
    pictureUrl: string | null;
  };
  summaries: {
    likesCount: number;
  };
}

interface CommentCreateOutput {
  id: string;
  text: string;
  createdAt: Date;
  postId: string;
  userId: string;
}

interface ReplyCreateOutput extends CommentCreateOutput {
  commentId?: string;
}

// Definisi tipe result
type GetPostCommentsResult = Either<
  ErrorRegister.InputanSalah,
  CommentOutput[]
>;
type CreateCommentResult = Either<
  ErrorRegister.InputanSalah,
  CommentCreateOutput
>;
type DeleteCommentResult = Either<ErrorRegister.InputanSalah, void>;
type GetRepliesResult = Either<ErrorRegister.InputanSalah, ReplyOutput[]>;
type CreateReplyResult = Either<ErrorRegister.InputanSalah, ReplyCreateOutput>;
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

      const mappedComments = comments.map((c) => ({
        id: c.id.toString(),
        text: c.text,
        createdAt: extractDateFromSnowflake(c.id),
        user: c.user,
        summaries: {
          likesCount: 0,
          repliesCount: 0,
        },
      }));

      return right(mappedComments);
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

      const [inserted] = await this.db
        .insert(comment)
        .values({
          id: commentId,
          post_id: postId,
          user_id: userId,
          text: text,
          parent_id: null,
        })
        .returning({
          id: comment.id,
          text: comment.text,
          post_id: comment.post_id,
          user_id: comment.user_id,
        });

      // Notifikasi ke pemilik post
      const [postData] = await this.db
        .select()
        .from(post)
        .where(eq(post.id, postId))
        .limit(1);
      if (postData && postData.user_id !== userId) {
        const [profileData] = await this.db
          .select()
          .from(profile)
          .where(eq(profile.user_id, userId))
          .limit(1);
        const actorUsername = profileData?.username || 'Seseorang';
        await this.db.insert(notification).values({
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
    try {
      const commentToDelete = await this.db
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

      await this.db.delete(comment).where(eq(comment.id, commentId));

      return right(undefined);
    } catch (error) {
      console.error('Error deleting comment:', error);
      return left(new ErrorRegister.InputanSalah('Gagal menghapus komentar'));
    }
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

      const mappedReplies = replies.map((r) => ({
        id: r.id.toString(),
        text: r.text,
        createdAt: extractDateFromSnowflake(r.id),
        user: r.user,
        summaries: {
          likesCount: 0,
        },
      }));

      return right(mappedReplies);
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

      const [inserted] = await this.db
        .insert(comment)
        .values({
          id: replyId,
          post_id: postId,
          user_id: userId,
          text: text,
          parent_id: commentId,
        })
        .returning({
          id: comment.id,
          text: comment.text,
          post_id: comment.post_id,
          parent_id: comment.parent_id,
          user_id: comment.user_id,
        });

      // Notifikasi ke pemilik komentar
      const [commentData] = await this.db
        .select()
        .from(commentTable)
        .where(eq(commentTable.id, commentId))
        .limit(1);
      if (commentData && commentData.user_id !== userId) {
        const [profileData] = await this.db
          .select()
          .from(profile)
          .where(eq(profile.user_id, userId))
          .limit(1);
        const actorUsername = profileData?.username || 'Seseorang';
        await this.db.insert(notification).values({
          id: generateSnowflakeId(),
          user_id: commentData.user_id,
          description: `${actorUsername} membalas komentarmu`,
          category: 'reply',
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
    try {
      const replyToDelete = await this.db
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

      await this.db.delete(comment).where(eq(comment.id, replyId));

      return right(undefined);
    } catch (error) {
      console.error('Error deleting reply:', error);
      return left(
        new ErrorRegister.InputanSalah('Gagal menghapus balasan komentar'),
      );
    }
  }
}
