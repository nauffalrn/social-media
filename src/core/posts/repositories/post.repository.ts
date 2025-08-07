import { Injectable } from '@nestjs/common';
import { and, desc, eq, isNull, sql } from 'drizzle-orm';
import { post, post_tag, profile, comment, post_like } from 'src/infrastructure/database/schema';
import { db } from 'src/infrastructure/database';
import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterDrizzleOrm } from '@nestjs-cls/transactional-adapter-drizzle-orm';

type DrizzleClient = typeof db;
type MyDrizzleAdapter = TransactionalAdapterDrizzleOrm<DrizzleClient>;

@Injectable()
export class PostRepository {
  constructor(private readonly txHost: TransactionHost<MyDrizzleAdapter>) {}

  async insertPost(postData: any) {
    return this.txHost.tx.insert(post).values(postData);
  }

  async updatePost(postId: bigint, update: any) {
    return this.txHost.tx.update(post).set(update).where(eq(post.id, postId));
  }

  async findPostById(postId: bigint) {
    return this.txHost.tx.select().from(post).where(eq(post.id, postId)).limit(1);
  }

  async deletePost(postId: bigint) {
    return this.txHost.tx.update(post).set({ deleted_at: new Date() }).where(eq(post.id, postId));
  }

  async insertTags(tags: any[]) {
    return Promise.all(tags.map(tag => this.txHost.tx.insert(post_tag).values(tag)));
  }

  async findPostsByUserId(userId: bigint, take: number, offset: number) {
    return this.txHost.tx
      .select()
      .from(post)
      .where(and(eq(post.user_id, userId), isNull(post.deleted_at)))
      .orderBy(desc(post.id))
      .limit(take)
      .offset(offset);
  }

  async findTaggedPostsByUserId(userId: bigint, take: number, offset: number) {
    return this.txHost.tx
      .select()
      .from(post_tag)
      .where(eq(post_tag.user_id, userId))
      .orderBy(desc(post_tag.post_id))
      .limit(take)
      .offset(offset);
  }

  async getProfileByUserId(userId: bigint) {
    return this.txHost.tx.select().from(profile).where(eq(profile.user_id, userId)).limit(1);
  }

  async countLikes(postId: bigint) {
    return this.txHost.tx
      .select({ count: sql`count(*)` })
      .from(post_like)
      .where(eq(post_like.post_id, postId));
  }

  async countComments(postId: bigint) {
    return this.txHost.tx
      .select({ count: sql`count(*)` })
      .from(comment)
      .where(and(eq(comment.post_id, postId), isNull(comment.parent_id)));
  }

  async getTagsByPostId(postId: bigint) {
    return this.txHost.tx
      .select({ user_id: post_tag.user_id })
      .from(post_tag)
      .where(eq(post_tag.post_id, postId));
  }
}