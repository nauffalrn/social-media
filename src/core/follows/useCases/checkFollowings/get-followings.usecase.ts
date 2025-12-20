import { Injectable } from '@nestjs/common';
import { UserRepository } from 'src/core/users/repositories/user.repository';
import { Either, ErrorRegister, left, right } from 'src/libs/helpers/either';
import { FollowRepository } from '../../repositories/follow.repository';
import {
  GetFollowingsDto,
  GetFollowingsResponseDto,
} from './dto/get-followings.dto';

@Injectable()
export class GetFollowingsUseCase {
  constructor(
    private readonly followRepository: FollowRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(
    dto: GetFollowingsDto,
  ): Promise<Either<ErrorRegister.UserNotFound, GetFollowingsResponseDto>> {
    const profileData = await this.userRepository.findProfileByUsername(
      dto.username,
    );
    if (profileData.length === 0) {
      return left(new ErrorRegister.UserNotFound());
    }
    const userId = profileData[0].user_id;
    const offset = (dto.page - 1) * dto.take;

    const followingRecords =
      await this.followRepository.getFollowingsWithProfile(
        userId,
        dto.take,
        offset,
      );

    const followings = followingRecords.map((record) => ({
      fullName: record.fullName || '',
      username: record.username || '',
      pictureUrl: record.pictureUrl || '',
    }));

    const response: GetFollowingsResponseDto = { followings };
    return right(response);
  }
}
