import { ApiProperty } from '@nestjs/swagger';

export class GetPostsDto {
  @ApiProperty()
  username: string;
  @ApiProperty()
  take: number;
  @ApiProperty()
  page: number;
}