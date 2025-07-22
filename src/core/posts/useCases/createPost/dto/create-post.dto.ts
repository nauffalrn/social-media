import { ApiProperty } from '@nestjs/swagger';

export class CreatePostDto {
  @ApiProperty()
  username: string;
  @ApiProperty()
  caption?: string;
  @ApiProperty()
  pictureUrl: string;
  @ApiProperty()
  tags?: string[];
}
