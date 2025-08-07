import { Injectable } from '@nestjs/common';
import { generateSnowflakeId, extractDateFromSnowflake } from 'src/infrastructure/snowflake/snowflake';
import { Either, ErrorRegister, left, right } from 'src/libs/helpers/either';
import { FollowRepository } from './repositories/follow.repository';
import { UserRepository } from '../users/repositories/user.repository';
import { GetFollowersResponseDto } from './useCases/checkFollowers/dto/get-followers-response.dto';
import { GetFollowingsResponseDto } from './useCases/checkFollowings/dto/get-followings-response.dto';

type FollowUserResult = Either<
  | ErrorRegister.CannotFollowSelf
  | ErrorRegister.AlreadyFollowing
  | ErrorRegister.UserNotFound,
  {
    id: string;
    followerId: string;
    followingId: string;
    createdAt: Date;
  }
>;
type UnfollowUserResult = Either<ErrorRegister.NotFollowing | ErrorRegister.UserNotFound, void>;
type GetFollowersResult = Either<ErrorRegister.UserNotFound, GetFollowersResponseDto>;
type GetFollowingsResult = Either<ErrorRegister.UserNotFound, GetFollowingsResponseDto>;

@Injectable()
export class FollowsService {
  constructor(
    private readonly followRepository: FollowRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async followUser(
    followerId: bigint,
    followingId: bigint,
  ): Promise<FollowUserResult> {
    if (followerId === followingId) {
      return left(new ErrorRegister.CannotFollowSelf());
    }

    const existingFollow = await this.followRepository.findFollow(followerId, followingId);
    if (existingFollow.length > 0) {
      return left(new ErrorRegister.AlreadyFollowing());
    }

    // Insert follow (gunakan onConflictDoNothing jika ada di repo)
    const inserted = await this.followRepository.insertFollowReturning({
      id: generateSnowflakeId(),
      follower_id: followerId,
      following_id: followingId,
    });

    if (!inserted) {
      return left(new ErrorRegister.AlreadyFollowing());
    }

    // Notifikasi ke user yang di-follow
    if (followingId !== followerId) {
      const [profileData] = await this.userRepository.findProfileByUserId(followerId);
      const actorUsername = profileData?.username || 'Seseorang';
      await this.followRepository.insertNotification({
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
  }

  async unfollowUser(
    followerId: bigint,
    followingId: bigint,
  ): Promise<UnfollowUserResult> {
    const existingFollow = await this.followRepository.findFollow(followerId, followingId);
    if (existingFollow.length === 0) {
      return left(new ErrorRegister.NotFollowing());
    }

    await this.followRepository.deleteFollow(followerId, followingId);

    // Hapus notifikasi follow
    const [profileData] = await this.userRepository.findProfileByUserId(followerId);
    const actorUsername = profileData?.username || 'Seseorang';
    await this.followRepository.deleteNotification(
      followingId,
      `${actorUsername} mulai mengikuti Anda`,
    );

    return right(undefined);
  }

  async followUserByUsername(
    followerId: bigint,
    username: string,
  ): Promise<FollowUserResult> {
    const profileData = await this.userRepository.findProfileByUsername(username);
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
    const profileData = await this.userRepository.findProfileByUsername(username);
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
    const profileData = await this.userRepository.findProfileByUsername(username);
    if (profileData.length === 0) {
      return left(new ErrorRegister.UserNotFound());
    }
    const userId = profileData[0].user_id;
    const offset = (page - 1) * take;

    // Ambil followers dengan join ke profile
    const followerRecords = await this.followRepository.getFollowersWithProfile(userId, take, offset);

    const followers = followerRecords.map((record) => ({
      fullName: record.fullName || '',
      username: record.username || '',
      pictureUrl: record.pictureUrl || '',
    }));

    const response: GetFollowersResponseDto = { followers };
    return right(response);
  }

  async getFollowingsByUsername(
    username: string,
    take = 30,
    page = 1,
  ): Promise<GetFollowingsResult> {
    const profileData = await this.userRepository.findProfileByUsername(username);
    if (profileData.length === 0) {
      return left(new ErrorRegister.UserNotFound());
    }
    const userId = profileData[0].user_id;
    const offset = (page - 1) * take;

    // Ambil followings dengan join ke profile
    const followingRecords = await this.followRepository.getFollowingsWithProfile(userId, take, offset);

    const followings = followingRecords.map((record) => ({
      fullName: record.fullName || '',
      username: record.username || '',
      pictureUrl: record.pictureUrl || '',
    }));

    const response: GetFollowingsResponseDto = { followings };
    return right(response);
  }
}