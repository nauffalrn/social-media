import { ApiProperty } from '@nestjs/swagger';

export class GetFollowersDto {
  @ApiProperty()
  username: string;

  @ApiProperty()
  take: number;

  @ApiProperty()
  page: number;
}