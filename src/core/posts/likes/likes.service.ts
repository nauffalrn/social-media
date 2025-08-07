import { Injectable } from '@nestjs/common';
import { generateSnowflakeId } from 'src/infrastructure/snowflake/snowflake';
import { Either, ErrorRegister, left, right } from 'src/libs/helpers/either';
import { UnlikePostResponseDto } from './likesPost/useCases/unlikePost/dto/unlike-post-response.dto';
import { LikeRepository } from './repositories/like.repository';

// Definisikan tipe return yang jelas
type LikePostResult = Either<ErrorRegister.InputanSalah, void>;
type UnlikePostResult = Either<
  ErrorRegister.InputanSalah,
  UnlikePostResponseDto
>;

@Injectable()
export class LikesService {
  constructor(private readonly likeRepository: LikeRepository) {}

  async likePost(userId: bigint, postId: bigint): Promise<LikePostResult> {
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

  async unlikePost(userId: bigint, postId: bigint): Promise<UnlikePostResult> {
    try {
      // Hapus like
      await this.likeRepository.deleteLike(userId, postId);

      // Ambil post untuk dapatkan user_id pemilik post
      const [postData] = await this.likeRepository.getPostById(postId);

      if (postData) {
        // Hapus notifikasi like
        const [profileData] =
          await this.likeRepository.getProfileByUserId(userId);
        const actorUsername = profileData?.username || 'Seseorang';
        await this.likeRepository.deleteNotification(
          postData.user_id,
          postId,
          `${actorUsername} menyukai postinganmu`,
        );
      }

      return right(new UnlikePostResponseDto());
    } catch (error) {
      console.error('Error unliking post:', error);
      return left(
        new ErrorRegister.InputanSalah('Gagal membatalkan suka pada post'),
      );
    }
  }
}
