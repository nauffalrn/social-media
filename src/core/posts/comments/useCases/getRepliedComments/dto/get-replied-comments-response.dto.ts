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

class Replies {
  @ApiProperty()
  id: string;

  @ApiProperty()
  commentId: string;

  @ApiProperty()
  text: string;

  @ApiProperty()
  createdAt: string;

  @ApiProperty({ type: User })
  user: User;

  @ApiProperty({ type: Summaries })
  summaries: Summaries;
}

export class GetRepliedCommentsResponseDto {
  @ApiProperty({ type: [Replies] })
  replies: Array<Replies>;
}