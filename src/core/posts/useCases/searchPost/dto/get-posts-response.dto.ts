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
  commentsCount: number;
}

class Post {
  @ApiProperty()
  id: string;
  @ApiProperty()
  caption: string;
  @ApiProperty()
  pictureUrl: string;
  @ApiProperty({ type: [String] })
  tags: string[];
  @ApiProperty()
  createdAt: string;
  @ApiProperty({ type: User })
  user: User;
  @ApiProperty({ type: Summaries })
  summaries: Summaries;
}

export class GetPostsResponseDto {
  @ApiProperty({ type: [Post] })
  posts: Array<Post>;
}