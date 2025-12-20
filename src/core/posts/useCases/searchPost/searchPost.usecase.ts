import { Injectable } from '@nestjs/common';
import { Either, ErrorRegister, left, right } from 'src/libs/helpers/either';
import { UserRepository } from 'src/core/users/repositories/user.repository';
import { UsersService } from 'src/core/users/users.service';
import { PostRepository } from '../../repositories/post.repository';
import { GetPostsResponseDto } from './dto/search-post.dto';

type SearchPostResult = Either<
  ErrorRegister.UserNotFound | ErrorRegister.InputanSalah,
  GetPostsResponseDto
>;

@Injectable()
export class SearchPostUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly postRepository: PostRepository,
    private readonly usersService: UsersService,
  ) {}

  async execute(
    viewerId: bigint,
    query: string = '',
    take = 10,
    page = 1,
  ): Promise<SearchPostResult> {
    try {
      const offset = (page - 1) * take;

      // Get posts based on search query
      const posts = await this.postRepository.searchPosts(query, take, offset);

      const formattedPosts = posts.map((post) => ({
        id: post.id.toString(),
        caption: post.caption || '',
        pictureUrl: post.picture_url || '',
        tags: [],
        createdAt: post.created_at?.toISOString() || new Date().toISOString(),
        user: {
          username: post.username || '',
          pictureUrl: post.user_picture_url || '',
        },
        summaries: {
          likesCount: Number(post.likes_count) || 0,
          commentsCount: Number(post.comments_count) || 0,
        },
      }));

      return right({ posts: formattedPosts });
    } catch (error) {
      return left(new ErrorRegister.InputanSalah('Failed to search posts'));
    }
  }
}
