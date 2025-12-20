import { ApiProperty } from '@nestjs/swagger';

export class UpdateProfileDto {
  
  @ApiProperty()
  fullName?: string;
  @ApiProperty()
  bio?: string;
  @ApiProperty()
  username?: string;
  @ApiProperty()
  pictureUrl?: string;
  @ApiProperty()
  isPrivate?: boolean;
}