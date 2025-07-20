import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, isNull } from 'drizzle-orm';
import { UsersService } from '../users/users.service';
import { Post } from './entities/post.entity';
import { CreatePostDto } from './useCases/createPost/dto/create-post.dto';
import { Either, ErrorRegister, left, right } from 'src/libs/helpers/either';
import { DrizzleInstance } from 'src/infrastructure/database';
import { generateSnowflakeId } from 'src/infrastructure/snowflake/snowflake';
import { post, post_tag, profile } from 'src/infrastructure/database/schema';

type CreatePostResult = Either<ErrorRegister.InputanSalah | Error, Post>;
type DeletePostResult = Either<ErrorRegister.PostNotFound, void>;
type FindPostsByUsernameResult = Either<ErrorRegister.ProfilePrivate | ErrorRegister.UserNotFound, any[]>;

@Injectable()
export class PostsService {
  constructor(
    private readonly usersService: UsersService,
    @Inject('DB') private db: DrizzleInstance
  ) {}

  async create(userId: bigint, createPostDto: CreatePostDto): Promise<CreatePostResult> {
    try {
      const postId = generateSnowflakeId();

      // Simpan post ke database
      const [newPost] = await this.db
        .insert(post)
        .values({
          id: postId,
          user_id: userId,
          picture_url: createPostDto.pictureUrl,
          caption: createPostDto.caption || '',
          deleted_at: null,
        })
        .returning();

      // Map database result ke entity
      const postEntity: Post = {
        id: newPost.id.toString(),
        userId: newPost.user_id.toString(),
        pictureUrl: newPost.picture_url,
        caption: newPost.caption || '',
        createdAt: new Date(),
        isDeleted: false,
      };

      return right(postEntity);
    } catch (error) {
      console.error('Error creating post:', error);
      return left(new ErrorRegister.InputanSalah('Gagal membuat post'));
    }
  }

  async delete(userId: bigint, postId: bigint): Promise<DeletePostResult> {
    // Cek apakah post ada dan milik user tersebut
    const postToDelete = await this.db
      .select()
      .from(post)
      .where(and(eq(post.id, postId), eq(post.user_id, userId)))
      .limit(1);

    if (postToDelete.length === 0) {
      return left(new ErrorRegister.PostNotFound());
    }

    // Update status post menjadi deleted
    await this.db.update(post).set({ deleted_at: new Date() }).where(eq(post.id, postId));

    return right(undefined);
  }

  async findPostsByUsername(
    viewerId: bigint,
    username: string,
    take = 9,
    page = 1
  ): Promise<FindPostsByUsernameResult> {
    // Cari user berdasarkan username
    const profileData = await this.db.select().from(profile).where(eq(profile.username, username)).limit(1);

    if (profileData.length === 0) {
      return left(new ErrorRegister.UserNotFound());
    }

    const userId = profileData[0].user_id;

    // Cek apakah viewer dapat melihat postingan user
    const canViewResult = await this.usersService.canViewUserProfile(viewerId, userId);

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
    const mappedPosts = postsResult.map((result) => ({
      id: result.post.id.toString(),
      pictureUrl: result.post.picture_url,
      caption: result.post.caption,
      createdAt: new Date().toISOString(), // Akan diambil dari DB
      user: {
        username: result.profile.username,
        pictureUrl: result.profile.picture_url,
      },
      summaries: {
        likesCount: 0, // Tambahkan logika untuk menghitung likes
        commentsCount: 0, // Tambahkan logika untuk menghitung comments
      },
    }));

    return right(mappedPosts);
  }

  async findTaggedPostsByUsername(
    viewerId: bigint,
    username: string,
    take = 9,
    page = 1
  ): Promise<FindPostsByUsernameResult> {
    // Cari user berdasarkan username
    const profileData = await this.db.select().from(profile).where(eq(profile.username, username)).limit(1);

    if (profileData.length === 0) {
      return left(new ErrorRegister.UserNotFound());
    }

    const userId = profileData[0].user_id;

    // Cek apakah viewer dapat melihat postingan user
    const canViewResult = await this.usersService.canViewUserProfile(viewerId, userId);

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
    const mappedPosts = postsResult.map((result) => ({
      id: result.post.id.toString(),
      pictureUrl: result.post.picture_url,
      caption: result.post.caption,
      createdAt: new Date().toISOString(), // Akan diambil dari DB
      user: {
        username: result.profile.username,
        pictureUrl: result.profile.picture_url,
      },
      summaries: {
        likesCount: 0, // Implementasi perhitungan likes
        commentsCount: 0, // Implementasi perhitungan komentar
      },
    }));

    return right(mappedPosts);
  }
}
