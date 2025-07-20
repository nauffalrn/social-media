class GetPostCommentsResponseDto {
  comments: Array<{
    id: string;
    text: string;
    createdAt: string;
    user: {
      username: string;
      pictureUrl: string;
    }
    summaries: {
      likesCount: number;
      repliesCount: number;
    }
  }>
}