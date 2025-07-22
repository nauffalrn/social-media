import { ApiProperty } from '@nestjs/swagger';

export class UnlikeCommentDto {
  @ApiProperty()
  username: string;
  @ApiProperty()
  postId: string;
}