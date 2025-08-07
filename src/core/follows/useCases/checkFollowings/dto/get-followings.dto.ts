import { ApiProperty } from '@nestjs/swagger';


export class GetFollowingsDto {
  @ApiProperty()
  username: string;
  @ApiProperty()
  take: number;
  @ApiProperty()
  page: number;
}

class Followings {
  @ApiProperty()
  username: string;

  @ApiProperty()
  fullName: string;

  @ApiProperty()
  pictureUrl: string;
}

export class GetFollowingsResponseDto {
  @ApiProperty({ type: [Followings] })
  followings: Array<Followings>;
}