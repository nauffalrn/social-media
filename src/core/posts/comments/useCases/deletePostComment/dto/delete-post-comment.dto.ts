import { ApiProperty } from '@nestjs/swagger';

export class DeletePostCommentDto {
  @ApiProperty()
  username: string;
  @ApiProperty()
  postId: string;
  @ApiProperty()
  commentId: string;
}

export class DeletePostCommentResponseDto {}