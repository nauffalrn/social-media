import { Injectable } from '@nestjs/common';
import { Either, ErrorRegister, left, right } from 'src/libs/helpers/either';
import { CommentRepository } from '../../repositories/comment.repository';


@Injectable()
export class DeleteRepliedCommentUseCase {
  constructor(private readonly commentRepository: CommentRepository) {}

async execute(
    userId: bigint,
    replyId: bigint,
  ): Promise<Either<ErrorRegister.InputanSalah, void>> {
    // Ambil reply
    const [replyData] = await this.commentRepository.findCommentById(replyId);

    if (!replyData) {
      return left(new ErrorRegister.InputanSalah('Reply tidak ditemukan'));
    }

    // Hapus reply
    await this.commentRepository.deleteComment(replyId);

    // Hapus notifikasi reply
    const [profileData] =
      await this.commentRepository.getProfileByUserId(userId);
    const actorUsername = profileData?.username || 'Seseorang';
    await this.commentRepository.deleteNotification(
      replyData.user_id,
      `${actorUsername} membalas komentarmu`,
    );

    return right(undefined);
  }
}