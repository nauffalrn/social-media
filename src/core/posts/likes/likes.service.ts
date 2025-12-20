import { Injectable } from '@nestjs/common';
import { generateSnowflakeId } from 'src/infrastructure/snowflake/snowflake';
import { Either, ErrorRegister, left, right } from 'src/libs/helpers/either';
import { LikeRepository } from './repositories/like.repository';

@Injectable()
export class LikesService {
  constructor(private readonly likeRepository: LikeRepository) {}

  async likePost(userId: bigint, postId: bigint) {
    try {
      // Cek apakah sudah like
      const existingLike = await this.likeRepository.findLike(userId, postId);
      if (existingLike.length > 0) {
        return right({ message: 'Already liked' });
      }

      // Insert like
      await this.likeRepository.insertLike({
        id: generateSnowflakeId(),
        post_id: postId,
        user_id: userId,
      });

      return right({ message: 'Post liked successfully' });
    } catch (error) {
      return left(new ErrorRegister.InputanSalah('Failed to like post'));
    }
  }

  async unlikePost(userId: bigint, postId: bigint) {
    try {
      await this.likeRepository.deleteLike(userId, postId);
      return right({ message: 'Post unliked successfully' });
    } catch (error) {
      return left(new ErrorRegister.InputanSalah('Failed to unlike post'));
    }
  }
}