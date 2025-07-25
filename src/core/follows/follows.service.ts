import { Inject, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { DrizzleInstance } from 'src/infrastructure/database';
import {
  follow,
  notification,
  profile,
} from 'src/infrastructure/database/schema';
import {
  extractDateFromSnowflake,
  generateSnowflakeId,
} from 'src/infrastructure/snowflake/snowflake';
import { Either, ErrorRegister, left, right } from 'src/libs/helpers/either';
import { Follow } from './entities/follow.entity';

type FollowUserResult = Either<
  | ErrorRegister.CannotFollowSelf
  | ErrorRegister.AlreadyFollowing
  | ErrorRegister.UserNotFound,
  Follow
>;
type UnfollowUserResult = Either<
  ErrorRegister.NotFollowing | ErrorRegister.UserNotFound,
  void
>;
type GetFollowersResult = Either<
  ErrorRegister.UserNotFound,
  { fullName: string; username: string; pictureUrl: string }[]
>;
type GetFollowingsResult = Either<
  ErrorRegister.UserNotFound,
  { fullName: string; username: string; pictureUrl: string }[]
>;

@Injectable()
export class FollowsService {
  constructor(@Inject('DB') private db: DrizzleInstance) {}

  async followUser(
    followerId: bigint,
    followingId: bigint,
  ): Promise<FollowUserResult> {
    return await this.db.transaction(async (trx) => {
      if (followerId === followingId) {
        return left(new ErrorRegister.CannotFollowSelf());
      }

      const existingFollow = await trx
        .select()
        .from(follow)
        .where(
          and(
            eq(follow.follower_id, followerId),
            eq(follow.following_id, followingId),
          ),
        )
        .limit(1);

      if (existingFollow.length > 0) {
        return left(new ErrorRegister.AlreadyFollowing());
      }

      const [inserted] = await trx
        .insert(follow)
        .values({
          id: generateSnowflakeId(),
          follower_id: followerId,
          following_id: followingId,
        })
        .onConflictDoNothing({
          target: [follow.follower_id, follow.following_id],
        })
        .returning({
          id: follow.id,
          follower_id: follow.follower_id,
          following_id: follow.following_id,
        });

      if (!inserted) {
        return left(new ErrorRegister.AlreadyFollowing());
      }

      // Notifikasi ke user yang di-follow
      if (followingId !== followerId) {
        const [profileData] = await trx
          .select()
          .from(profile)
          .where(eq(profile.user_id, followerId))
          .limit(1);
        const actorUsername = profileData?.username || 'Seseorang';
        await trx.insert(notification).values({
          id: generateSnowflakeId(),
          user_id: followingId,
          description: `${actorUsername} mulai mengikuti Anda`,
          category: 'follow',
        });
      }

      return right({
        id: inserted.id.toString(),
        followerId: inserted.follower_id.toString(),
        followingId: inserted.following_id.toString(),
        createdAt: extractDateFromSnowflake(inserted.id),
      });
    });
  }

  async unfollowUser(
    followerId: bigint,
    followingId: bigint,
  ): Promise<UnfollowUserResult> {
    return await this.db.transaction(async (trx) => {
      const existingFollow = await trx
        .select()
        .from(follow)
        .where(
          and(
            eq(follow.follower_id, followerId),
            eq(follow.following_id, followingId),
          ),
        )
        .limit(1);

      if (existingFollow.length === 0) {
        return left(new ErrorRegister.NotFollowing());
      }

      await trx
        .delete(follow)
        .where(
          and(
            eq(follow.follower_id, followerId),
            eq(follow.following_id, followingId),
          ),
        );
      return right(undefined);
    });
  }

  async followUserByUsername(
    followerId: bigint,
    username: string,
  ): Promise<FollowUserResult> {
    const profileData = await this.db
      .select()
      .from(profile)
      .where(eq(profile.username, username))
      .limit(1);

    if (profileData.length === 0) {
      return left(new ErrorRegister.UserNotFound());
    }

    const followingId = profileData[0].user_id;
    return this.followUser(followerId, followingId);
  }

  async unfollowUserByUsername(
    followerId: bigint,
    username: string,
  ): Promise<UnfollowUserResult> {
    const profileData = await this.db
      .select()
      .from(profile)
      .where(eq(profile.username, username))
      .limit(1);

    if (profileData.length === 0) {
      return left(new ErrorRegister.UserNotFound());
    }

    const followingId = profileData[0].user_id;
    return this.unfollowUser(followerId, followingId);
  }

  async getFollowersByUsername(
    username: string,
    take = 30,
    page = 1,
  ): Promise<GetFollowersResult> {
    const profileData = await this.db
      .select()
      .from(profile)
      .where(eq(profile.username, username))
      .limit(1);

    if (profileData.length === 0) {
      return left(new ErrorRegister.UserNotFound());
    }

    const userId = profileData[0].user_id;
    const offset = (page - 1) * take;

    const followerRecords = await this.db
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

    return right(
      followerRecords.map((record) => ({
        fullName: record.fullName || '',
        username: record.username || '',
        pictureUrl: record.pictureUrl || '',
      })),
    );
  }

  async getFollowingsByUsername(
    username: string,
    take = 30,
    page = 1,
  ): Promise<GetFollowingsResult> {
    const profileData = await this.db
      .select()
      .from(profile)
      .where(eq(profile.username, username))
      .limit(1);

    if (profileData.length === 0) {
      return left(new ErrorRegister.UserNotFound());
    }

    const userId = profileData[0].user_id;
    const offset = (page - 1) * take;

    const followingRecords = await this.db
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

    return right(
      followingRecords.map((record) => ({
        fullName: record.fullName || '',
        username: record.username || '',
        pictureUrl: record.pictureUrl || '',
      })),
    );
  }
}
