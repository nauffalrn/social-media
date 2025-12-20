import { Injectable } from '@nestjs/common';
import { UserRepository } from 'src/core/users/repositories/user.repository';
import { Either, ErrorRegister, left, right } from 'src/libs/helpers/either';
import { FollowRepository } from '../../repositories/follow.repository';

@Injectable()
export class UnfollowUserUseCase {
  constructor(
    private readonly followRepository: FollowRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(
    followerId: bigint,
    username: string,
  ): Promise<
    Either<ErrorRegister.NotFollowing | ErrorRegister.UserNotFound, void>
  > {
    const profileData =
      await this.userRepository.findProfileByUsername(username);
    if (profileData.length === 0) {
      return left(new ErrorRegister.UserNotFound());
    }
    const followingId = profileData[0].user_id;

    const existingFollow = await this.followRepository.findFollow(
      followerId,
      followingId,
    );
    if (existingFollow.length === 0) {
      return left(new ErrorRegister.NotFollowing());
    }

    await this.followRepository.deleteFollow(followerId, followingId);

    // Hapus notifikasi follow
    const [profileDataFollower] =
      await this.userRepository.findProfileByUserId(followerId);
    const actorUsername = profileDataFollower?.username || 'Seseorang';
    await this.followRepository.deleteNotification(
      followingId,
      `${actorUsername} mulai mengikuti Anda`,
    );

    return right(undefined);
  }
}
