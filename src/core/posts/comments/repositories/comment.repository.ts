import { Injectable, Inject } from '@nestjs/common';
import { db } from 'src/infrastructure/database';
import {
  comment,
  post,
  profile,
  notification,
  comment_like,
} from 'src/infrastructure/database/schema';
import { eq, and, isNull, sql } from 'drizzle-orm';

type DrizzleClient = typeof db;

@Injectable()
export class CommentRepository {
  constructor(
    @Inject('DATABASE_CONNECTION') private readonly db: DrizzleClient,
  ) {}

  async insertComment(commentData: any) {
    return this.db.insert(comment).values(commentData).returning();
  }

  async findCommentById(commentId: bigint) {
    return this.db
      .select()
      .from(comment)
      .where(eq(comment.id, commentId))
      .limit(1);
  }

  async deleteComment(commentId: bigint) {
    return this.db
      .update(comment)
      .set({ deleted_at: new Date() })
      .where(eq(comment.id, commentId));
  }

  async getPostComments(postId: bigint, take: number, offset: number) {
    return this.db
      .select({
        id: comment.id,
        post_id: comment.post_id,
        user_id: comment.user_id,
        text: comment.text,
        parent_id: comment.parent_id,
        username: profile.username,
        pictureUrl: profile.picture_url,
      })
      .from(comment)
      .leftJoin(profile, eq(comment.user_id, profile.user_id))
      .where(and(eq(comment.post_id, postId), isNull(comment.deleted_at)))
      .limit(take)
      .offset(offset);
  }

  async getRepliedComments(commentId: bigint, take: number, offset: number) {
    return this.db
      .select({
        id: comment.id,
        post_id: comment.post_id,
        user_id: comment.user_id,
        text: comment.text,
        parent_id: comment.parent_id,
        username: profile.username,
        pictureUrl: profile.picture_url,
      })
      .from(comment)
      .leftJoin(profile, eq(comment.user_id, profile.user_id))
      .where(and(eq(comment.parent_id, commentId), isNull(comment.deleted_at)))
      .limit(take)
      .offset(offset);
  }

  async getReplies(commentId: bigint, take: number, page: number) {
    const offset = (page - 1) * take;
    return this.getRepliedComments(commentId, take, offset);
  }

  async getPostById(postId: bigint) {
    return this.db.select().from(post).where(eq(post.id, postId)).limit(1);
  }

  async getProfileByUserId(userId: bigint) {
    return this.db
      .select()
      .from(profile)
      .where(eq(profile.user_id, userId))
      .limit(1);
  }

  async insertNotification(data: any) {
    return this.db.insert(notification).values(data);
  }

  async deleteNotification(userId: bigint, description: string) {
    return this.db
      .delete(notification)
      .where(
        and(
          eq(notification.user_id, userId),
          eq(notification.description, description),
        ),
      );
  }

  async countCommentLikes(commentId: bigint) {
    const result = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(comment_like)
      .where(eq(comment_like.comment_id, commentId));
    return Number(result[0]?.count || 0);
  }

  async countReplies(commentId: bigint) {
    const result = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(comment)
      .where(and(eq(comment.parent_id, commentId), isNull(comment.deleted_at)));
    return Number(result[0]?.count || 0);
  }
}
