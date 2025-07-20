import { Inject, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { DrizzleInstance } from 'src/infrastructure/database';
import { post_like } from 'src/infrastructure/database/schema';
import { generateSnowflakeId } from 'src/infrastructure/snowflake/snowflake';
import { Either, ErrorRegister, left, right } from 'src/libs/helpers/either';

// Definisikan tipe return yang jelas
type LikePostResult = Either<ErrorRegister.InputanSalah, void>;
type UnlikePostResult = Either<ErrorRegister.InputanSalah, void>;

@Injectable()
export class LikesService {
  constructor(@Inject('DB') private db: DrizzleInstance) {}

  async likePost(userId: bigint, postId: bigint): Promise<LikePostResult> {
    try {
      const existingLike = await this.db
        .select()
        .from(post_like)
        .where(and(eq(post_like.post_id, postId), eq(post_like.user_id, userId)))
        .limit(1);

      if (existingLike.length > 0) {
        return right(undefined); // Sudah like, tidak perlu dilakukan lagi
      }

      await this.db.insert(post_like).values({
        id: generateSnowflakeId(),
        post_id: postId,
        user_id: userId,
      });

      return right(undefined);
    } catch (error) {
      console.error('Error liking post:', error);
      return left(new ErrorRegister.InputanSalah('Gagal menyukai post'));
    }
  }

  async unlikePost(userId: bigint, postId: bigint): Promise<UnlikePostResult> {
    try {
      await this.db.delete(post_like).where(and(eq(post_like.post_id, postId), eq(post_like.user_id, userId)));

      return right(undefined);
    } catch (error) {
      console.error('Error unliking post:', error);
      return left(new ErrorRegister.InputanSalah('Gagal membatalkan suka pada post'));
    }
  }
}
