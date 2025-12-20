import { Injectable } from '@nestjs/common';
import { FollowRepository } from '../../repositories/follow.repository';
import { UserRepository } from 'src/core/users/repositories/user.repository';
import { Either, ErrorRegister, left, right } from 'src/libs/helpers/either';
import { GetFollowersDto, GetFollowersResponseDto } from './dto/get-followers.dto';

@Injectable()
export class GetFollowersUseCase {
  constructor(
    private readonly followRepository: FollowRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(dto: GetFollowersDto): Promise<Either<ErrorRegister.UserNotFound, GetFollowersResponseDto>> {
    const profileData = await this.userRepository.findProfileByUsername(dto.username);
    if (profileData.length === 0) {
      return left(new ErrorRegister.UserNotFound());
    }
    const userId = profileData[0].user_id;
    const offset = (dto.page - 1) * dto.take;

    const followerRecords = await this.followRepository.getFollowersWithProfile(userId, dto.take, offset);

    const followers = followerRecords.map((record) => ({
      fullName: record.fullName || '',
      username: record.username || '',
      pictureUrl: record.pictureUrl || '',
    }));

    const response: GetFollowersResponseDto = { followers };
    return right(response);
  }
}