import { ApiProperty } from '@nestjs/swagger';

export class FollowingDto {
  @ApiProperty()
  username: string;

  @ApiProperty()
  followId: string;
}

export class FollowingResponseDto {}