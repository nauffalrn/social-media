class GetProfileResponseDto {
  username: string;
  fullName: string;
  bio: string;
  pictureUrl: string;
  summaries: {
    postsCounts
    followingsCount: number;
    followersCount: number
  }
  recentPosts: Array<{
    id: string;
    pictureUrl: string;
  }>
}