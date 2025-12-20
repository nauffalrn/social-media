import { Injectable } from '@nestjs/common';
import { generateSnowflakeId } from 'src/infrastructure/snowflake/snowflake';
import { UploadsService } from 'src/infrastructure/storage/uploads.service';
import { Either, ErrorRegister, left, right } from 'src/libs/helpers/either';
import { PostRepository } from '../../repositories/post.repository';
import { CreatePostDto, CreatePostResponseDto } from './dto/create-post.dto';

type CreatePostResult = Either<
  ErrorRegister.InputanSalah | Error,
  CreatePostResponseDto
>;

@Injectable()
export class CreatePostUseCase {
  constructor(
    private readonly postRepository: PostRepository,
    private readonly uploadsService: UploadsService,
  ) {}

  async execute(
    userId: bigint,
    createPostDto: CreatePostDto,
    file?: any,
  ): Promise<CreatePostResult> {
    try {
      const postId = generateSnowflakeId();

      // Upload file jika ada
      let pictureUrl = '';
      if (file) {
        const uploadResult = await this.uploadsService.upload(file);
        pictureUrl = uploadResult.secure_url;
      }

      // Insert post
      await this.postRepository.insertPost({
        id: postId,
        user_id: userId,
        picture_url: pictureUrl,
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

      return right({
        id: postId.toString(),
        userId: userId.toString(),
        pictureUrl: pictureUrl,
        caption: createPostDto.caption || '',
        createdAt: new Date(),
        isDeleted: false,
      });
    } catch (error) {
      console.error('Error creating post:', error);
      return left(new ErrorRegister.InputanSalah('Gagal membuat post'));
    }
  }
}
