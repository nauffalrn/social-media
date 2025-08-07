import { ApiProperty } from '@nestjs/swagger';

export class DeleteRepliedCommentDto {
  @ApiProperty()
  username: string;
  @ApiProperty()
  postId: string;
  @ApiProperty()
  commentId: string;
  @ApiProperty()
  replyId: string;
}

export class DeleteRepliedCommentResponseDto {}