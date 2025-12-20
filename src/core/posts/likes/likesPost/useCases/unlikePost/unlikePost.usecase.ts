import { Injectable } from '@nestjs/common';
import { LikeRepository } from '../../../repositories/like.repository';
import { Either, ErrorRegister, left, right } from 'src/libs/helpers/either';
import { UnlikePostResponseDto } from './dto/unlike-post-comment.dto';

@Injectable()
export class UnlikePostUseCase {
  constructor(private readonly likeRepository: LikeRepository) {}

  async unlikePost(userId: bigint, postId: bigint): Promise<Either<ErrorRegister.InputanSalah, void>> {
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

      return right(undefined);
    } catch (error) {
      console.error('Error unliking post:', error);
      return left(
        new ErrorRegister.InputanSalah('Gagal membatalkan suka pada post'),
      );
    }
  }
}