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

export class GetRepliedCommentsResponseDto {
  @ApiProperty({ type: [Object] })
  replies: Array<{
    id: string;
    commentId: string;
    text: string;
    createdAt: string;
    user: User;
    summaries: Summaries;
  }>
}