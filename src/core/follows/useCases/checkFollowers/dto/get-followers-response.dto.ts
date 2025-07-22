import { ApiProperty } from '@nestjs/swagger';

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