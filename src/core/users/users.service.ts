import { Injectable } from '@nestjs/common';
import { Either, ErrorRegister, left, right } from 'src/libs/helpers/either';
import { UserRepository } from './repositories/user.repository';

@Injectable()
export class UsersService {
  constructor(private readonly userRepository: UserRepository) {}

  async canViewUserProfile(
    viewerId: bigint,
    profileUserId: bigint,
  ): Promise<Either<ErrorRegister.UserNotFound, boolean>> {
    // Jika viewer sama dengan profile owner, selalu bisa lihat
    if (viewerId === profileUserId) {
      return right(true);
    }

    try {
      // Cek apakah user exists
      const userExists = await this.userRepository.findUserById(profileUserId);
      if (userExists.length === 0) {
        return left(new ErrorRegister.UserNotFound());
      }

      // Cek apakah profile private
      const profileData = await this.userRepository.findProfileByUserId(profileUserId);
      if (profileData.length === 0) {
        return right(true); // Jika tidak ada profile data, anggap public
      }

      const isPrivate = profileData[0].is_private;
      if (!isPrivate) {
        return right(true); // Profile public, bisa dilihat
      }

      // Jika private, cek apakah viewer sudah follow
      // Implementasi logic follow checking di sini
      // Untuk sementara return false untuk private accounts
      return right(false);
    } catch (error) {
      return left(new ErrorRegister.UserNotFound());
    }
  }

  async findUserById(userId: bigint) {
    try {
      const userData = await this.userRepository.findUserById(userId);
      if (userData.length === 0) {
        return left(new ErrorRegister.UserNotFound());
      }
      return right(userData[0]);
    } catch (error) {
      return left(new ErrorRegister.UserNotFound());
    }
  }
}