import { IsNotEmpty, IsString } from 'class-validator';

export class CreateReplyDto {
  @IsNotEmpty()
  @IsString()
  text: string;
}

class CreateRepliedCommentDto {
  userId: string;
  postId: string;
  commentId: string;
  text: string;
}
