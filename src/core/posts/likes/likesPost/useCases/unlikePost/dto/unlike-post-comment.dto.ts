import { ApiProperty } from '@nestjs/swagger';

export class UnlikePostDto {
  @ApiProperty()
  username: string;
  @ApiProperty()
  postId: string;
}

export class UnlikePostResponseDto {}