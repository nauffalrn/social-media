import { ApiProperty } from '@nestjs/swagger';

export class SearchPostDto {
  @ApiProperty({ required: false })
  query?: string;

  @ApiProperty({ required: false })
  take?: number;

  @ApiProperty({ required: false })
  page?: number;
}

class PostUser {
  @ApiProperty()
  username: string;

  @ApiProperty()
  pictureUrl: string;
}

class PostSummaries {
  @ApiProperty()
  likesCount: number;

  @ApiProperty()
  commentsCount: number;
}

export class SearchPostResponseDto {
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

  @ApiProperty({ type: PostUser })
  user: PostUser;

  @ApiProperty({ type: PostSummaries })
  summaries: PostSummaries;
}

export class GetPostsResponseDto {
  @ApiProperty({ type: [SearchPostResponseDto] })
  posts: SearchPostResponseDto[];
}