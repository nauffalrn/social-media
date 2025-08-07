import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterDrizzleOrm } from '@nestjs-cls/transactional-adapter-drizzle-orm';
import { Injectable } from '@nestjs/common';
import { and, desc, eq, isNull, sql } from 'drizzle-orm';
import { db } from 'src/infrastructure/database';
import { comment, comment_like, notification, post, profile } from 'src/infrastructure/database/schema';

type DrizzleClient = typeof db;
type MyDrizzleAdapter = TransactionalAdapterDrizzleOrm<DrizzleClient>;

@Injectable()
export class CommentRepository {
  constructor(private readonly txHost: TransactionHost<MyDrizzleAdapter>) {}

  // Insert comment (untuk comment dan reply)
  async insertComment(commentData: any) {
    // returning() hanya didukung di beberapa DB, jika tidak, select lagi setelah insert
    const [inserted] = await this.txHost.tx
      .insert(comment)
      .values(commentData)
      .returning();
    return inserted;
  }

  // Hapus comment/reply
  async deleteComment(commentId: bigint) {
    return this.txHost.tx.delete(comment).where(eq(comment.id, commentId));
  }

  // Ambil comment/reply by id
  async findCommentById(commentId: bigint) {
    return this.txHost.tx.select().from(comment).where(eq(comment.id, commentId)).limit(1);
  }

  // Ambil comments utama (bukan reply) untuk sebuah post, join ke profile user
  async getPostComments(postId: bigint, take: number, page: number) {
    const offset = (page - 1) * take;
    return this.txHost.tx
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
      .orderBy(desc(comment.id))
      .limit(take)
      .offset(offset);
  }

  // Ambil replies untuk sebuah comment, join ke profile user
  async getReplies(commentId: bigint, take: number, page: number) {
    const offset = (page - 1) * take;
    return this.txHost.tx
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
      .orderBy(desc(comment.id))
      .limit(take)
      .offset(offset);
  }

  // Hitung jumlah likes untuk sebuah comment/reply
  async countCommentLikes(commentId: bigint): Promise<number> {
    const [{ count }] = await this.txHost.tx
      .select({ count: sql`count(*)` })
      .from(comment_like)
      .where(eq(comment_like.comment_id, commentId));
    return Number(count) || 0;
  }

  // Hitung jumlah replies untuk sebuah comment/reply
  async countReplies(commentId: bigint): Promise<number> {
    const [{ count }] = await this.txHost.tx
      .select({ count: sql`count(*)` })
      .from(comment)
      .where(eq(comment.parent_id, commentId));
    return Number(count) || 0;
  }

  // Insert notifikasi (untuk comment/reply)
  async insertNotification(notificationData: any) {
    return this.txHost.tx.insert(notification).values(notificationData);
  }

  // Hapus notifikasi (untuk comment/reply)
  async deleteNotification(userId: bigint, description: string) {
    return this.txHost.tx
      .delete(notification)
      .where(
        and(
          eq(notification.user_id, userId),
          // category bisa 'comment' atau 'reply', jadi tidak perlu filter category di sini
          eq(notification.description, description),
        ),
      );
  }

  // Ambil profile user by userId
  async getProfileByUserId(userId: bigint) {
    return this.txHost.tx.select().from(profile).where(eq(profile.user_id, userId)).limit(1);
  }

  // Ambil post by postId
  async getPostById(postId: bigint) {
    return this.txHost.tx.select().from(post).where(eq(post.id, postId)).limit(1);
  }
}