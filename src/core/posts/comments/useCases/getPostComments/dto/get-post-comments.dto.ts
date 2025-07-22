import { ApiProperty } from '@nestjs/swagger';

export class GetPostCommentsDto {
  @ApiProperty()
  username: string;
  @ApiProperty()
  postId: string;
}