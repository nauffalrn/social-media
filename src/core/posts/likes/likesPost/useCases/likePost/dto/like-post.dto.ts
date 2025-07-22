import { ApiProperty } from '@nestjs/swagger';

export class LikePostDto {
  @ApiProperty()
  username: string;
  @ApiProperty()
  postId: string;
}