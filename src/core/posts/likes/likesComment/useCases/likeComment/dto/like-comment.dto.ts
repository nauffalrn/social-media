import { ApiProperty } from '@nestjs/swagger';

export class LikeCommentDto {
  @ApiProperty()
  userId: string;
  @ApiProperty()
  postId: string;
}

export class LikeCommentResponseDto {}