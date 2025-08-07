import { ApiProperty } from '@nestjs/swagger';

export class GetTaggedPostsDto {
  @ApiProperty()
  username: string;

  @ApiProperty()
  take: number;

  @ApiProperty()
  page: number;
}

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

export class GetTaggedPostsResponseDto {
  @ApiProperty()
  posts: Array<{
    id: string;
    caption: string;
    pictureUrl: string;
    tags: Array<string>;
    createdAt: string;
    user: User;
    summaries: Summaries
  }>
}