import { Inject, Injectable } from '@nestjs/common';
import { PostRepository } from '../../repositories/post.repository';
import { Either, ErrorRegister, left, right } from 'src/libs/helpers/either';

@Injectable()
export class DeletePostUseCase {
  constructor(
    @Inject(PostRepository)
    private readonly postRepository: PostRepository,
  ) {}

async execute(userId: bigint, postId: bigint): Promise<Either<ErrorRegister.PostNotFound, void>> {
    const postToDelete = await this.postRepository.findPostById(postId);
    if (!postToDelete.length || postToDelete[0].user_id !== userId) {
      return left(new ErrorRegister.PostNotFound());
    }
    await this.postRepository.deletePost(postId);
    return right(undefined);
  }
}