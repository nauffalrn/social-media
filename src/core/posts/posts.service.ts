import { Injectable } from '@nestjs/common';
import { generateSnowflakeId } from 'src/infrastructure/snowflake/snowflake';
import { Either, ErrorRegister, left, right } from 'src/libs/helpers/either';
import { UserRepository } from '../users/repositories/user.repository';
import { UsersService } from '../users/users.service';
import { PostRepository } from './repositories/post.repository';
import { CreatePostResponseDto } from './useCases/createPost/dto/create-post-response.dto';
import { CreatePostDto } from './useCases/createPost/dto/create-post.dto';
import { GetPostsResponseDto } from './useCases/searchPost/dto/get-posts-response.dto';

type CreatePostResult = Either<
  ErrorRegister.InputanSalah | Error,
  CreatePostResponseDto
>;
type DeletePostResult = Either<ErrorRegister.PostNotFound, void>;
type FindPostsByUsernameResult = Either<
  ErrorRegister.ProfilePrivate | ErrorRegister.UserNotFound,
  GetPostsResponseDto
>;

@Injectable()
export class PostsService {
  constructor(
    private readonly usersService: UsersService,
    private readonly postRepository: PostRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async create(
    userId: bigint,
    createPostDto: CreatePostDto,
  ): Promise<CreatePostResult> {
    try {
      const postId = generateSnowflakeId();
      await this.postRepository.insertPost({
        id: postId,
        user_id: userId,
        picture_url: createPostDto.pictureUrl,
        caption: createPostDto.caption || '',
        deleted_at: null,
      });

      // Simpan tags jika ada
      if (createPostDto.tags && createPostDto.tags.length > 0) {
        await this.postRepository.insertTags(
          createPostDto.tags.map((tagUserId: string) => ({
            post_id: postId,
            user_id: BigInt(tagUserId),
          })),
        );
      }

      const postResponse: CreatePostResponseDto = {
        id: postId.toString(),
        userId: userId.toString(),
        pictureUrl: createPostDto.pictureUrl,
        caption: createPostDto.caption || '',
        createdAt: new Date(),
        isDeleted: false,
      };

      return right(postResponse);
    } catch (error) {
      console.error('Error creating post:', error);
      return left(new ErrorRegister.InputanSalah('Gagal membuat post'));
    }
  }

  async delete(userId: bigint, postId: bigint): Promise<DeletePostResult> {
    const postToDelete = await this.postRepository.findPostById(postId);
    if (!postToDelete.length || postToDelete[0].user_id !== userId) {
      return left(new ErrorRegister.PostNotFound());
    }
    await this.postRepository.deletePost(postId);
    return right(undefined);
  }

  async findPostsByUsername(
    viewerId: bigint,
    username: string,
    take = 9,
    page = 1,
  ): Promise<FindPostsByUsernameResult> {
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

    // Hitung offset berdasarkan page dan take
    const offset = (page - 1) * take;

    // Ambil post dengan pagination
    const postsResult = await this.postRepository.findPostsByUserId(
      userId,
      take,
      offset,
    );

    // Map hasil query ke format yang sesuai
    const mappedPosts = await Promise.all(
      postsResult.map(async (result: any) => {
        // Hitung jumlah likes
        const likesCountArr = await this.postRepository.countLikes(result.id);
        const likesCount = likesCountArr[0]?.count ?? 0;

        // Hitung jumlah comments
        const commentsCountArr = await this.postRepository.countComments(
          result.id,
        );
        const commentsCount = commentsCountArr[0]?.count ?? 0;

        // Ambil tags
        const tagsResult = await this.postRepository.getTagsByPostId(result.id);
        const tags = tagsResult.map((tag: any) => tag.user_id.toString());

        // Ambil profile user
        const profileArr = await this.postRepository.getProfileByUserId(
          result.user_id ?? userId,
        );
        const profile = profileArr[0] || {};

        return {
          id: result.id.toString(),
          pictureUrl: result.picture_url,
          caption: result.caption,
          tags,
          createdAt: new Date().toISOString(),
          user: {
            username: profile.username ?? '',
            pictureUrl: profile.picture_url ?? '',
          },
          summaries: {
            likesCount: Number(likesCount) || 0,
            commentsCount: Number(commentsCount) || 0,
          },
        };
      }),
    );

    const response: GetPostsResponseDto = { posts: mappedPosts };
    return right(response);
  }

  async findTaggedPostsByUsername(
    viewerId: bigint,
    username: string,
    take = 9,
    page = 1,
  ): Promise<FindPostsByUsernameResult> {
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

    // Hitung offset berdasarkan page dan take
    const offset = (page - 1) * take;

    // Ambil post yang memiliki tag user dengan pagination
    const taggedPostsResult = await this.postRepository.findTaggedPostsByUserId(
      userId,
      take,
      offset,
    );

    // Map hasil query ke format yang sesuai
    const mappedTaggedPosts = await Promise.all(
      taggedPostsResult.map(async (result: any) => {
        // Ambil post detail
        const postArr = await this.postRepository.findPostById(result.post_id);
        const postData = postArr[0];
        if (!postData) return null;

        // Hitung jumlah likes
        const likesCountArr = await this.postRepository.countLikes(postData.id);
        const likesCount = likesCountArr[0]?.count ?? 0;

        // Hitung jumlah comments
        const commentsCountArr = await this.postRepository.countComments(
          postData.id,
        );
        const commentsCount = commentsCountArr[0]?.count ?? 0;

        // Ambil tags
        const tagsResult = await this.postRepository.getTagsByPostId(
          postData.id,
        );
        const tags = tagsResult.map((tag: any) => tag.user_id.toString());

        // Ambil profile user
        const profileArr = await this.postRepository.getProfileByUserId(
          postData.user_id,
        );
        const profile = profileArr[0] || {};

        return {
          id: postData.id.toString(),
          pictureUrl: postData.picture_url,
          caption: postData.caption,
          tags,
          createdAt: new Date().toISOString(),
          user: {
            username: profile.username ?? '',
            pictureUrl: profile.picture_url ?? '',
          },
          summaries: {
            likesCount: Number(likesCount) || 0,
            commentsCount: Number(commentsCount) || 0,
          },
        };
      }),
    );

    const filteredTaggedPosts = mappedTaggedPosts.filter(
      (post): post is NonNullable<typeof post> => post !== null
    );

    const taggedResponse: GetPostsResponseDto = { posts: filteredTaggedPosts };
    return right(taggedResponse);
  }
}
