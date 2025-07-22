import { ApiProperty } from '@nestjs/swagger';

export class GetProfileDto {
  @ApiProperty()
  username: string;
}