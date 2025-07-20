class GetPostsResponseDto {
  posts: Array<{
    id: string;
    caption: string;
    pictureUrl: string;
    tags: Array<string>;
    createdAt: string;
    user: {
      username: string;
      pictureUrl: string;
    }
    summaries: {
      likesCount: number;
      commentsCount: number;
    }
  }>
}