import { Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { post_like, notification, post, profile } from 'src/infrastructure/database/schema';
import { db } from 'src/infrastructure/database';
import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterDrizzleOrm } from '@nestjs-cls/transactional-adapter-drizzle-orm';

type DrizzleClient = typeof db;
type MyDrizzleAdapter = TransactionalAdapterDrizzleOrm<DrizzleClient>;

@Injectable()
export class LikeRepository {
  constructor(private readonly txHost: TransactionHost<MyDrizzleAdapter>) {}

  async findLike(userId: bigint, postId: bigint) {
    return this.txHost.tx
      .select()
      .from(post_like)
      .where(and(eq(post_like.post_id, postId), eq(post_like.user_id, userId)))
      .limit(1);
  }

  async insertLike(likeData: any) {
    return this.txHost.tx.insert(post_like).values(likeData);
  }

  async deleteLike(userId: bigint, postId: bigint) {
    return this.txHost.tx
      .delete(post_like)
      .where(and(eq(post_like.post_id, postId), eq(post_like.user_id, userId)));
  }

  async insertNotification(notificationData: any) {
    return this.txHost.tx.insert(notification).values(notificationData);
  }

  async deleteNotification(userId: bigint, postId: bigint, description: string) {
    return this.txHost.tx
      .delete(notification)
      .where(
        and(
          eq(notification.user_id, userId),
          eq(notification.category, 'like'),
          eq(notification.description, description),
        ),
      );
  }

  async getPostById(postId: bigint) {
    return this.txHost.tx.select().from(post).where(eq(post.id, postId)).limit(1);
  }

  async getProfileByUserId(userId: bigint) {
    return this.txHost.tx.select().from(profile).where(eq(profile.user_id, userId)).limit(1);
  }
}