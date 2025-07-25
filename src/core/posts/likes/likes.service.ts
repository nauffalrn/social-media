import { Inject, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { DrizzleInstance } from 'src/infrastructure/database';
import {
  notification,
  post,
  post_like,
  profile,
} from 'src/infrastructure/database/schema'; // Tambahkan import
import { generateSnowflakeId } from 'src/infrastructure/snowflake/snowflake';
import { Either, ErrorRegister, left, right } from 'src/libs/helpers/either';
import { UnlikePostResponseDto } from './likesPost/useCases/unlikePost/dto/unlike-post-response.dto';

// Definisikan tipe return yang jelas
type LikePostResult = Either<ErrorRegister.InputanSalah, void>;
type UnlikePostResult = Either<
  ErrorRegister.InputanSalah,
  UnlikePostResponseDto
>;

@Injectable()
export class LikesService {
  constructor(@Inject('DB') private db: DrizzleInstance) {}

  async likePost(userId: bigint, postId: bigint): Promise<LikePostResult> {
    return await this.db.transaction(async (trx) => {
      try {
        const existingLike = await trx
          .select()
          .from(post_like)
          .where(
            and(eq(post_like.post_id, postId), eq(post_like.user_id, userId)),
          )
          .limit(1);

        if (existingLike.length > 0) {
          return right(undefined); // Sudah like, tidak perlu dilakukan lagi
        }

        await trx.insert(post_like).values({
          id: generateSnowflakeId(),
          post_id: postId,
          user_id: userId,
        });

        // Ambil post dan pemiliknya
        const [postData] = await trx
          .select()
          .from(post)
          .where(eq(post.id, postId))
          .limit(1);
        if (postData && postData.user_id !== userId) {
          // Ambil username pelaku
          const [profileData] = await trx
            .select()
            .from(profile)
            .where(eq(profile.user_id, userId))
            .limit(1);
          const actorUsername = profileData?.username || 'Seseorang';
          await trx.insert(notification).values({
            id: generateSnowflakeId(),
            user_id: postData.user_id,
            description: `${actorUsername} menyukai postinganmu`,
            category: 'like',
          });
        }

        return right(undefined);
      } catch (error) {
        console.error('Error liking post:', error);
        return left(new ErrorRegister.InputanSalah('Gagal menyukai post'));
      }
    });
  }

  async unlikePost(userId: bigint, postId: bigint): Promise<UnlikePostResult> {
    return await this.db.transaction(async (trx) => {
      try {
        await trx
          .delete(post_like)
          .where(
            and(eq(post_like.post_id, postId), eq(post_like.user_id, userId)),
          );
        return right(new UnlikePostResponseDto());
      } catch (error) {
        console.error('Error unliking post:', error);
        return left(
          new ErrorRegister.InputanSalah('Gagal membatalkan suka pada post'),
        );
      }
    });
  }
}
