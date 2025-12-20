import { ApiProperty } from '@nestjs/swagger';

export class CreatePostDto {
  @ApiProperty()
  caption: string;

  @ApiProperty({ type: 'string', format: 'binary', required: false })
  file?: any;

  @ApiProperty({ type: [String], required: false })
  tags?: string[];
}

export class CreatePostResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  pictureUrl: string;

  @ApiProperty()
  caption: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  isDeleted: boolean;
}
