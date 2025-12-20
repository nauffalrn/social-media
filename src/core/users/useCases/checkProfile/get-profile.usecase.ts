import { Injectable } from '@nestjs/common';
import { Either, ErrorRegister, left, right } from 'src/libs/helpers/either';
import { UserRepository } from '../../repositories/user.repository';
import { GetProfileResponseDto } from './dto/get-profile.dto';

@Injectable()
export class GetProfileUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(
    username: string,
  ): Promise<Either<ErrorRegister.UserNotFound, GetProfileResponseDto>> {
    if (!username) {
      return left(new ErrorRegister.UserNotFound());
    }
    const profileRecord =
      await this.userRepository.findProfileByUsername(username);
    if (profileRecord.length === 0) {
      return left(new ErrorRegister.UserNotFound());
    }
    const userId = profileRecord[0].user_id;
    const userData = await this.userRepository.findUserById(userId);
    if (userData.length === 0) {
      return left(new ErrorRegister.UserNotFound());
    }
    const postCount = await this.userRepository.countPosts(userId);
    const followersCount = await this.userRepository.countFollowers(userId);
    const followingsCount = await this.userRepository.countFollowings(userId);
    const recentPosts = await this.userRepository.getRecentPosts(userId);

    const profileData = profileRecord[0];
    const postsCount = postCount[0]?.count || 0;
    const followersCountData = followersCount[0]?.count || 0;
    const followingsCountData = followingsCount[0]?.count || 0;

    const userProfile: GetProfileResponseDto = {
      userId: userId.toString(),
      username: profileData.username || '',
      fullName: profileData.full_name || '',
      bio: profileData.bio || '',
      pictureUrl: profileData.picture_url || '',
      isPrivate: profileData.is_private || false,
      postsCount: Number(postsCount),
      followersCount: Number(followersCountData),
      followingCount: Number(followingsCountData),
      recentPosts: recentPosts.map((p) => ({
        id: p.id.toString(),
        pictureUrl: p.picture_url || '', // GANTI dari p.pictureUrl
      })),
    };

    return right(userProfile);
  }
}
