import { Injectable, ConsoleLogger } from '@nestjs/common';
import { Either, ErrorRegister, left, right } from 'src/libs/helpers/either';
import { UserRepository } from '../../repositories/user.repository';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UpdateProfileUseCase {
  private readonly logger = new ConsoleLogger(UpdateProfileUseCase.name);

  constructor(private readonly userRepository: UserRepository) {}

  async execute(userId: bigint, updateProfileDto: UpdateProfileDto): Promise<Either<ErrorRegister.UserNotFound | Error, any>> {
    try {
      await this.userRepository.updateProfile(userId, {
        full_name: updateProfileDto.fullName,
        bio: updateProfileDto.bio,
        username: updateProfileDto.username,
        picture_url: updateProfileDto.pictureUrl,
        is_private: updateProfileDto.isPrivate,
      });

      const profileRecord = await this.userRepository.findProfileByUserId(userId);
      if (profileRecord.length === 0) {
        return left(new ErrorRegister.UserNotFound());
      }
      const userRecord = await this.userRepository.findUserById(userId);
      if (userRecord.length === 0) {
        return left(new ErrorRegister.UserNotFound());
      }
      const emailRecord = await this.userRepository.findEmailById(userRecord[0].email_id);

      return right({
        id: userId.toString(),
        email: emailRecord[0].value,
        isEmailVerified: !!emailRecord[0].verified_at,
        fullName: profileRecord[0].full_name ?? undefined,
        bio: profileRecord[0].bio ?? undefined,
        username: profileRecord[0].username ?? undefined,
        pictureUrl: profileRecord[0].picture_url ?? undefined,
        isPrivate: profileRecord[0].is_private ?? false,
      });
    } catch (error) {
      this.logger.error(error);
      return left(new Error('Terjadi kesalahan, silahkan hubungi pihak kami.'));
    }
  }
}