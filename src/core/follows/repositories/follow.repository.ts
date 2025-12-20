import { Injectable, Inject } from '@nestjs/common';
import { db } from 'src/infrastructure/database';
import {
  follow,
  profile,
  notification,
} from 'src/infrastructure/database/schema';
import { eq, and } from 'drizzle-orm';

type DrizzleClient = typeof db;

@Injectable()
export class FollowRepository {
  constructor(
    @Inject('DATABASE_CONNECTION') private readonly db: DrizzleClient,
  ) {}

  async getFollowersWithProfile(userId: bigint, take: number, offset: number) {
    return this.db
      .select({
        id: follow.id,
        followerId: follow.follower_id,
        fullName: profile.full_name,
        username: profile.username,
        pictureUrl: profile.picture_url,
      })
      .from(follow)
      .innerJoin(profile, eq(follow.follower_id, profile.user_id))
      .where(eq(follow.following_id, userId))
      .limit(take)
      .offset(offset);
  }

  async getFollowingsWithProfile(userId: bigint, take: number, offset: number) {
    return this.db
      .select({
        id: follow.id,
        followingId: follow.following_id,
        fullName: profile.full_name,
        username: profile.username,
        pictureUrl: profile.picture_url,
      })
      .from(follow)
      .innerJoin(profile, eq(follow.following_id, profile.user_id))
      .where(eq(follow.follower_id, userId))
      .limit(take)
      .offset(offset);
  }

  async insertFollowReturning(data: any) {
    return this.db.insert(follow).values(data).returning();
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

  async findFollow(followerId: bigint, followingId: bigint) {
    return this.db
      .select()
      .from(follow)
      .where(
        and(
          eq(follow.follower_id, followerId),
          eq(follow.following_id, followingId),
        ),
      )
      .limit(1);
  }

  async insertFollow(followData: any) {
    return this.db.insert(follow).values(followData);
  }

  async deleteFollow(followerId: bigint, followingId: bigint) {
    return this.db
      .delete(follow)
      .where(
        and(
          eq(follow.follower_id, followerId),
          eq(follow.following_id, followingId),
        ),
      );
  }

  async getFollowers(userId: bigint, take: number, offset: number) {
    return this.db
      .select()
      .from(follow)
      .where(eq(follow.following_id, userId))
      .limit(take)
      .offset(offset);
  }

  async getFollowing(userId: bigint, take: number, offset: number) {
    return this.db
      .select()
      .from(follow)
      .where(eq(follow.follower_id, userId))
      .limit(take)
      .offset(offset);
  }
}
