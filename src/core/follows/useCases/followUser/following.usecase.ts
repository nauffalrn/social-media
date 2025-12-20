import { Injectable } from '@nestjs/common';
import { UserRepository } from 'src/core/users/repositories/user.repository';
import { generateSnowflakeId } from 'src/infrastructure/snowflake/snowflake';
import { ErrorRegister, left, right } from 'src/libs/helpers/either';
import { Follow } from '../../entities/follow.entity';
import { FollowRepository } from '../../repositories/follow.repository';

type FollowUserResult = ReturnType<typeof right> | ReturnType<typeof left>;

@Injectable()
export class FollowUserUseCase {
  constructor(
    private readonly followRepository: FollowRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(
    followerId: bigint,
    username: string,
  ): Promise<FollowUserResult> {
    const profileData =
      await this.userRepository.findProfileByUsername(username);
    if (profileData.length === 0) {
      return left(new ErrorRegister.UserNotFound());
    }
    const followingId = profileData[0].user_id;

    if (followerId === followingId) {
      return left(new ErrorRegister.CannotFollowSelf());
    }

    const existingFollow = await this.followRepository.findFollow(
      followerId,
      followingId,
    );
    if (existingFollow.length > 0) {
      return left(new ErrorRegister.AlreadyFollowing());
    }

    const inserted = await this.followRepository.insertFollowReturning({
      id: generateSnowflakeId(),
      follower_id: followerId,
      following_id: followingId,
    });

    // Ambil data pertama karena returning() mengembalikan array
    const followData = inserted[0];

    if (!followData) {
      return left(new ErrorRegister.AlreadyFollowing());
    }

    // Notifikasi ke user yang di-follow
    if (followingId !== followerId) {
      const [profileData] =
        await this.userRepository.findProfileByUserId(followerId);
      const actorUsername = profileData?.username || 'Seseorang';
      await this.followRepository.insertNotification({
        id: generateSnowflakeId(),
        user_id: followingId,
        description: `${actorUsername} mulai mengikuti Anda`,
        category: 'follow',
      });
    }

    return right(
      new Follow({
        id: followData.id.toString(),
        followerId: followData.follower_id.toString(),
        followingId: followData.following_id.toString(),
        createdAt: new Date(), // atau extractDateFromSnowflake(inserted.id)
      }),
    );
  }
}
