import { ApiProperty } from '@nestjs/swagger';

export class DeletePostDto {
  @ApiProperty()
  username: string;
  @ApiProperty()
  postId: string;
}

export class DeletePostResponseDto {}