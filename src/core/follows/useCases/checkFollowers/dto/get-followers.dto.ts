import { ApiProperty } from '@nestjs/swagger';

export class GetFollowersDto {
  @ApiProperty()
  username: string;

  @ApiProperty()
  take: number;

  @ApiProperty()
  page: number;
}

class Followers {
  @ApiProperty()
  username: string;

  @ApiProperty()
  fullName: string;

  @ApiProperty()
  pictureUrl: string;
}

export class GetFollowersResponseDto {
  @ApiProperty({ type: [Followers] })
  followers: Array<Followers>;
}