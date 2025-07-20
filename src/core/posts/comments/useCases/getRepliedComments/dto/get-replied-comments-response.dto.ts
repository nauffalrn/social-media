class GetRepliedCommentsResponseDto {
  replies: Array<{
    id: string;
    commentId: string;
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