import { ApiProperty } from '@nestjs/swagger';

class User {
  @ApiProperty()
  username: string;

  @ApiProperty()
  pictureUrl: string;
}

class Summaries {
  @ApiProperty()
  likesCount: number;

  @ApiProperty()
  repliesCount: number;
}

export class GetPostCommentsResponseDto {
  @ApiProperty({ type: [Object] })
  comments: Array<{
    id: string;
    text: string;
    createdAt: string;
    user: User;
    summaries: Summaries;
  }>
}