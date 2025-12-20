import { Inject, Injectable } from '@nestjs/common';
import { db } from 'src/infrastructure/database';
import {
  post,
  profile,
  post_like,
  comment,
  post_tag,
} from 'src/infrastructure/database/schema';
import { eq, and, or, ilike, isNull, desc, sql } from 'drizzle-orm';

type DrizzleClient = typeof db;

@Injectable()
export class PostRepository {
  constructor(
    @Inject('DATABASE_CONNECTION') private readonly db: DrizzleClient,
  ) {}

  async insertPost(postData: any) {
    return this.db.insert(post).values(postData);
  }

  async updatePost(postId: bigint, update: any) {
    return this.db.update(post).set(update).where(eq(post.id, postId));
  }

  async findPostById(postId: bigint) {
    return this.db.select().from(post).where(eq(post.id, postId)).limit(1);
  }

  async deletePost(postId: bigint) {
    return this.db
      .update(post)
      .set({ deleted_at: new Date() })
      .where(eq(post.id, postId));
  }

  async insertTags(tags: any[]) {
    return this.db.insert(post_tag).values(tags);
  }

  async findPostsByUserId(userId: bigint, take: number, offset: number) {
    return this.db
      .select()
      .from(post)
      .where(and(eq(post.user_id, userId), isNull(post.deleted_at)))
      .orderBy(desc(post.id))
      .limit(take)
      .offset(offset);
  }

  async searchPosts(query: string, take: number, offset: number) {
    return this.db
      .select({
        id: post.id,
        caption: post.caption,
        picture_url: post.picture_url,
        created_at: post.created_at,
        username: profile.username,
        user_picture_url: profile.picture_url,
        likes_count: sql<number>`COALESCE(COUNT(DISTINCT ${post_like.id}), 0)`,
        comments_count: sql<number>`COALESCE(COUNT(DISTINCT ${comment.id}), 0)`,
      })
      .from(post)
      .leftJoin(profile, eq(post.user_id, profile.user_id))
      .leftJoin(post_like, eq(post.id, post_like.post_id))
      .leftJoin(comment, eq(post.id, comment.post_id))
      .where(
        and(
          or(
            ilike(post.caption, `%${query}%`),
            ilike(profile.username, `%${query}%`),
          ),
          isNull(post.deleted_at),
        ),
      )
      .groupBy(
        post.id,
        post.caption,
        post.picture_url,
        post.created_at,
        profile.username,
        profile.picture_url,
      )
      .orderBy(desc(post.created_at))
      .limit(take)
      .offset(offset);
  }
}
