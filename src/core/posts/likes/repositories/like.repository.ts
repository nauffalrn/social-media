import { Injectable, Inject } from '@nestjs/common';
import { db } from 'src/infrastructure/database';
import {
  post_like,
  comment_like,
  post,
  profile,
  notification,
} from 'src/infrastructure/database/schema';
import { eq, and } from 'drizzle-orm';

type DrizzleClient = typeof db;

@Injectable()
export class LikeRepository {
  constructor(
    @Inject('DATABASE_CONNECTION') private readonly db: DrizzleClient,
  ) {}

  async findPostLike(userId: bigint, postId: bigint) {
    return this.db
      .select()
      .from(post_like)
      .where(and(eq(post_like.user_id, userId), eq(post_like.post_id, postId)))
      .limit(1);
  }

  async findLike(userId: bigint, postId: bigint) {
    return this.findPostLike(userId, postId);
  }

  async insertPostLike(likeData: any) {
    return this.db.insert(post_like).values(likeData);
  }

  async insertLike(likeData: any) {
    return this.insertPostLike(likeData);
  }

  async deletePostLike(userId: bigint, postId: bigint) {
    return this.db
      .delete(post_like)
      .where(and(eq(post_like.user_id, userId), eq(post_like.post_id, postId)));
  }

  async deleteLike(userId: bigint, postId: bigint) {
    return this.deletePostLike(userId, postId);
  }

  async findCommentLike(userId: bigint, commentId: bigint) {
    return this.db
      .select()
      .from(comment_like)
      .where(
        and(
          eq(comment_like.user_id, userId),
          eq(comment_like.comment_id, commentId),
        ),
      )
      .limit(1);
  }

  async insertCommentLike(likeData: any) {
    return this.db.insert(comment_like).values(likeData);
  }

  async deleteCommentLike(userId: bigint, commentId: bigint) {
    return this.db
      .delete(comment_like)
      .where(
        and(
          eq(comment_like.user_id, userId),
          eq(comment_like.comment_id, commentId),
        ),
      );
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

  async deleteNotification(
    userId: bigint,
    postId: bigint,
    description: string,
  ) {
    return this.db
      .delete(notification)
      .where(
        and(
          eq(notification.user_id, userId),
          eq(notification.description, description),
        ),
      );
  }
}
