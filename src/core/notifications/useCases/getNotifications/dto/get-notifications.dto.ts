import { ApiProperty } from '@nestjs/swagger';

export class GetNotificationsDto {
  @ApiProperty()
  username: string;
}