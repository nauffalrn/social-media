import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, isNull, sql } from 'drizzle-orm';
import { DrizzleInstance } from 'src/infrastructure/database';
import {
  comment,
  post,
  post_like,
  post_tag,
  profile,
} from 'src/infrastructure/database/schema';
import { generateSnowflakeId } from 'src/infrastructure/snowflake/snowflake';
import { Either, ErrorRegister, left, right } from 'src/libs/helpers/either';
import { UsersService } from '../users/users.service';
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
    @Inject('DB') private db: DrizzleInstance,
  ) {}

  async create(
    userId: bigint,
    createPostDto: CreatePostDto,
  ): Promise<CreatePostResult> {
    return await this.db.transaction(async (trx) => {
      try {
        const postId = generateSnowflakeId();
        const [newPost] = await trx
          .insert(post)
          .values({
            id: postId,
            user_id: userId,
            picture_url: createPostDto.pictureUrl,
            caption: createPostDto.caption || '',
            deleted_at: null,
          })
          .returning();

        // Simpan tags jika ada
        if (createPostDto.tags && createPostDto.tags.length > 0) {
          await Promise.all(
            createPostDto.tags.map((tagUserId) =>
              trx.insert(post_tag).values({
                post_id: postId,
                user_id: BigInt(tagUserId),
              }),
            ),
          );
        }

        const postResponse: CreatePostResponseDto = {
          id: newPost.id.toString(),
          userId: newPost.user_id.toString(),
          pictureUrl: newPost.picture_url,
          caption: newPost.caption || '',
          createdAt: new Date(),
          isDeleted: false,
        };

        return right(postResponse);
      } catch (error) {
        console.error('Error creating post:', error);
        return left(new ErrorRegister.InputanSalah('Gagal membuat post'));
      }
    });
  }

  async delete(userId: bigint, postId: bigint): Promise<DeletePostResult> {
    return await this.db.transaction(async (trx) => {
      // Cek apakah post ada dan milik user tersebut
      const postToDelete = await trx
        .select()
        .from(post)
        .where(and(eq(post.id, postId), eq(post.user_id, userId)))
        .limit(1);

      if (postToDelete.length === 0) {
        return left(new ErrorRegister.PostNotFound());
      }

      // Update status post menjadi deleted
      await trx
        .update(post)
        .set({ deleted_at: new Date() })
        .where(eq(post.id, postId));

      return right(undefined);
    });
  }

  async findPostsByUsername(
    viewerId: bigint,
    username: string,
    take = 9,
    page = 1,
  ): Promise<FindPostsByUsernameResult> {
    // Cari user berdasarkan username
    const profileData = await this.db
      .select()
      .from(profile)
      .where(eq(profile.username, username))
      .limit(1);

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
    const postsResult = await this.db
      .select({
        post: {
          id: post.id,
          picture_url: post.picture_url,
          caption: post.caption,
        },
        profile: {
          username: profile.username,
          picture_url: profile.picture_url,
        },
      })
      .from(post)
      .innerJoin(profile, eq(post.user_id, profile.user_id))
      .where(and(eq(post.user_id, userId), isNull(post.deleted_at)))
      .limit(take)
      .offset(offset)
      .orderBy(desc(post.id));

    // Map hasil query ke format yang sesuai
    const mappedPosts = await Promise.all(
      postsResult.map(async (result) => {
        // Hitung jumlah likes
        const [{ count: likesCount }] = await this.db
          .select({ count: sql`count(*)` })
          .from(post_like)
          .where(eq(post_like.post_id, result.post.id));

        // Hitung jumlah comments
        const [{ count: commentsCount }] = await this.db
          .select({ count: sql`count(*)` })
          .from(comment)
          .where(
            and(eq(comment.post_id, result.post.id), isNull(comment.parent_id)),
          );

        // Ambil tags
        const tagsResult = await this.db
          .select({ user_id: post_tag.user_id })
          .from(post_tag)
          .where(eq(post_tag.post_id, result.post.id));
        const tags = tagsResult.map((tag) => tag.user_id.toString());

        return {
          id: result.post.id.toString(),
          pictureUrl: result.post.picture_url,
          caption: result.post.caption,
          tags, // <-- tambahkan ini
          createdAt: new Date().toISOString(),
          user: {
            username: result.profile.username ?? '',
            pictureUrl: result.profile.picture_url ?? '',
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
    const profileData = await this.db
      .select()
      .from(profile)
      .where(eq(profile.username, username))
      .limit(1);

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
    const postsResult = await this.db
      .select({
        post: {
          id: post.id,
          picture_url: post.picture_url,
          caption: post.caption,
        },
        profile: {
          username: profile.username,
          picture_url: profile.picture_url,
        },
      })
      .from(post_tag)
      .innerJoin(post, eq(post_tag.post_id, post.id))
      .innerJoin(profile, eq(post.user_id, profile.user_id))
      .where(and(eq(post_tag.user_id, userId), isNull(post.deleted_at)))
      .limit(take)
      .offset(offset)
      .orderBy(desc(post.id));

    // Map hasil query ke format yang sesuai
    const mappedTaggedPosts = await Promise.all(
      postsResult.map(async (result) => {
        // Hitung jumlah likes
        const [{ count: likesCount }] = await this.db
          .select({ count: sql`count(*)` })
          .from(post_like)
          .where(eq(post_like.post_id, result.post.id));

        // Hitung jumlah comments
        const [{ count: commentsCount }] = await this.db
          .select({ count: sql`count(*)` })
          .from(comment)
          .where(
            and(eq(comment.post_id, result.post.id), isNull(comment.parent_id)),
          );

        // Ambil tags
        const tagsResult = await this.db
          .select({ user_id: post_tag.user_id })
          .from(post_tag)
          .where(eq(post_tag.post_id, result.post.id));
        const tags = tagsResult.map((tag) => tag.user_id.toString());

        return {
          id: result.post.id.toString(),
          pictureUrl: result.post.picture_url,
          caption: result.post.caption,
          tags, // <-- tambahkan ini
          createdAt: new Date().toISOString(),
          user: {
            username: result.profile.username ?? '',
            pictureUrl: result.profile.picture_url ?? '',
          },
          summaries: {
            likesCount: Number(likesCount) || 0,
            commentsCount: Number(commentsCount) || 0,
          },
        };
      }),
    );

    const taggedResponse: GetPostsResponseDto = { posts: mappedTaggedPosts };
    return right(taggedResponse);
  }
}
