import { Inject, Injectable } from '@nestjs/common';
import { CommentRepository } from '../../repositories/comment.repository';
import { Either, ErrorRegister, left, right } from 'src/libs/helpers/either';

@Injectable()
export class DeletePostCommentUseCase {
  constructor(
    private readonly commentRepository: CommentRepository,
  ) {}

async execute(
    userId: bigint,
    commentId: bigint,
  ): Promise<Either<ErrorRegister.InputanSalah, void>> {
    // Ambil comment
    const [commentData] =
      await this.commentRepository.findCommentById(commentId);

    if (!commentData) {
      return left(new ErrorRegister.InputanSalah('Komentar tidak ditemukan'));
    }

    // Hapus comment
    await this.commentRepository.deleteComment(commentId);

    // Hapus notifikasi comment
    const [profileData] =
      await this.commentRepository.getProfileByUserId(userId);
    const actorUsername = profileData?.username || 'Seseorang';
    await this.commentRepository.deleteNotification(
      commentData.user_id,
      `${actorUsername} mengomentari postinganmu`,
    );

    return right(undefined);
  }
}