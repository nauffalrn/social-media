import { Injectable } from '@nestjs/common';
import { Either, ErrorRegister, left, right } from 'src/libs/helpers/either';
import { UserRepository } from 'src/core/users/repositories/user.repository';
import { UsersService } from 'src/core/users/users.service';
import { PostRepository } from '../../repositories/post.repository';

type TaggedPostResult = Either<
  ErrorRegister.ProfilePrivate | ErrorRegister.UserNotFound,
  any
>;

@Injectable()
export class TaggedPostUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly postRepository: PostRepository,
    private readonly usersService: UsersService,
  ) {}

  async execute(
    viewerId: bigint,
    username: string,
    take = 9,
    page = 1,
  ): Promise<TaggedPostResult> {
    // Cari user berdasarkan username
    const profileData =
      await this.userRepository.findProfileByUsername(username);
    if (profileData.length === 0) {
      return left(new ErrorRegister.UserNotFound());
    }
    const userId = profileData[0].user_id;

    // Cek apakah viewer dapat melihat postingan user
    const canViewResult = await this.usersService.canViewUserProfile(
      viewerId,
      userId,
    );

    if (canViewResult.isLeft()) {
      return left(canViewResult.error);
    }

    if (!canViewResult.value) {
      return left(new ErrorRegister.ProfilePrivate());
    }

    // Get tagged posts (implementasi sesuai kebutuhan)
    const offset = (page - 1) * take;
    // Implementasi get tagged posts di repository
    const posts = []; // Placeholder - implementasi sesuai kebutuhan

    return right({ posts });
  }
}
