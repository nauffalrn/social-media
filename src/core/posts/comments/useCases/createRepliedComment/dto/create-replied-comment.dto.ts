import { ApiProperty } from '@nestjs/swagger';

export class CreateRepliedCommentDto {
  @ApiProperty()
  username: string;
  @ApiProperty()
  postId: string;
  @ApiProperty()
  commentId: string;
  @ApiProperty()
  text: string;
}
