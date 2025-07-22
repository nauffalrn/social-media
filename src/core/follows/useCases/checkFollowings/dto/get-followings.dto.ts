import { ApiProperty } from '@nestjs/swagger';


export class GetFollowingsDto {
  @ApiProperty()
  username: string;
  @ApiProperty()
  take: number;
  @ApiProperty()
  page: number;
}