import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterDrizzleOrm } from '@nestjs-cls/transactional-adapter-drizzle-orm';
import { Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { db } from 'src/infrastructure/database';
import {
  follow,
  notification,
  profile,
} from 'src/infrastructure/database/schema';

type DrizzleClient = typeof db;
type MyDrizzleAdapter = TransactionalAdapterDrizzleOrm<DrizzleClient>;

@Injectable()
export class FollowRepository {
  constructor(private readonly txHost: TransactionHost<MyDrizzleAdapter>) {}

  async findFollow(followerId: bigint, followingId: bigint) {
    return this.txHost.tx
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
    return this.txHost.tx.insert(follow).values(followData);
  }

  async deleteFollow(followerId: bigint, followingId: bigint) {
    return this.txHost.tx
      .delete(follow)
      .where(
        and(
          eq(follow.follower_id, followerId),
          eq(follow.following_id, followingId),
        ),
      );
  }

  async insertNotification(notificationData: any) {
    return this.txHost.tx.insert(notification).values(notificationData);
  }

  async deleteNotification(userId: bigint, description: string) {
    return this.txHost.tx
      .delete(notification)
      .where(
        and(
          eq(notification.user_id, userId),
          eq(notification.category, 'follow'),
          eq(notification.description, description),
        ),
      );
  }

  async getProfileByUserId(userId: bigint) {
    return this.txHost.tx
      .select()
      .from(profile)
      .where(eq(profile.user_id, userId))
      .limit(1);
  }

  async insertFollowReturning(followData: any) {
    return (
      await this.txHost.tx
        .insert(follow)
        .values(followData)
        .onConflictDoNothing()
        .returning()
    )[0];
  }

  // Untuk join followers
  async getFollowersWithProfile(userId: bigint, take: number, offset: number) {
    return this.txHost.tx
      .select({
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

  // Untuk join followings
  async getFollowingsWithProfile(userId: bigint, take: number, offset: number) {
    return this.txHost.tx
      .select({
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
}
