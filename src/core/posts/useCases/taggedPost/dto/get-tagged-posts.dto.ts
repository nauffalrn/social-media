import { ApiProperty } from '@nestjs/swagger';

export class GetTaggedPostsDto {
  @ApiProperty()
  username: string;

  @ApiProperty()
  take: number;

  @ApiProperty()
  page: number;
}