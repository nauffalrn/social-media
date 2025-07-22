import { ApiProperty } from '@nestjs/swagger';

export class GetRepliedCommentsDto {
  @ApiProperty()
  username: string;
  @ApiProperty()
  postId: string;
  @ApiProperty()
  commentId: string;
}