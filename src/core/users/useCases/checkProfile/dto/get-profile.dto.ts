import { ApiProperty } from '@nestjs/swagger';

export class GetProfileDto {
  @ApiProperty()
  username: string;
}

class Summaries {
  @ApiProperty()
  postsCounts: number;
  @ApiProperty()
  followingsCount: number;
  @ApiProperty()
  followersCount: number;
}

class RecentPost {
  @ApiProperty()
  id: string;
  @ApiProperty()
  pictureUrl: string;
}

export class GetProfileResponseDto {
  @ApiProperty()
  username: string;
  @ApiProperty()
  fullName: string;
  @ApiProperty()
  bio: string;
  @ApiProperty()
  pictureUrl: string;
  @ApiProperty()
  summaries: Summaries;
  @ApiProperty({ type: [RecentPost] })
  recentPosts: Array<RecentPost>;
}