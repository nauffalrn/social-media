import { ApiProperty } from '@nestjs/swagger';

export class UnfollowingDto {
  @ApiProperty()
  username: string;

  @ApiProperty()
  followId: string;
}