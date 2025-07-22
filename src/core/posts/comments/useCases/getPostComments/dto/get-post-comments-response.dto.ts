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

class Comments {
  @ApiProperty()
  id: string;

  @ApiProperty()
  text: string;

  @ApiProperty()
  createdAt: string;

  @ApiProperty({ type: User })
  user: User;

  @ApiProperty({ type: Summaries })
  summaries: Summaries;
}

export class GetPostCommentsResponseDto {
  @ApiProperty({ type: [Comments] })
  comments: Array<Comments>;
}