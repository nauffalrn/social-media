import { Injectable } from '@nestjs/common';
import { LikeRepository } from '../../../repositories/like.repository';
import { Either, ErrorRegister, left, right } from 'src/libs/helpers/either';
import { generateSnowflakeId } from 'src/infrastructure/snowflake/snowflake';

@Injectable()
export class LikePostUseCase {
  constructor(private readonly likeRepository: LikeRepository) {}

async likePost(userId: bigint, postId: bigint): Promise<Either<ErrorRegister.InputanSalah, void>> {
    try {
      const existingLike = await this.likeRepository.findLike(userId, postId);
      if (existingLike.length > 0) {
        return right(undefined); // Sudah like, tidak perlu dilakukan lagi
      }

      await this.likeRepository.insertLike({
        id: generateSnowflakeId(),
        post_id: postId,
        user_id: userId,
      });

      // Ambil post dan pemiliknya
      const [postData] = await this.likeRepository.getPostById(postId);
      if (postData && postData.user_id !== userId) {
        // Ambil username pelaku
        const [profileData] =
          await this.likeRepository.getProfileByUserId(userId);
        const actorUsername = profileData?.username || 'Seseorang';
        await this.likeRepository.insertNotification({
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
  }
}