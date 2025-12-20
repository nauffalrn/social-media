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
  userId: string; // PASTIKAN ADA INI
  @ApiProperty()
  username: string;
  @ApiProperty()
  fullName: string;
  @ApiProperty()
  bio: string;
  @ApiProperty()
  pictureUrl: string;
  @ApiProperty()
  isPrivate: boolean;
  @ApiProperty()
  postsCount: number;
  @ApiProperty()
  followersCount: number;
  @ApiProperty()
  followingCount: number;
  @ApiProperty({ type: [RecentPost] })
  recentPosts: Array<{
    id: string;
    pictureUrl: string;
  }>;
}
