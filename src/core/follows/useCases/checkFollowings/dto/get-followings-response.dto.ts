import { ApiProperty } from '@nestjs/swagger';

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