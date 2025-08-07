import { ApiProperty } from '@nestjs/swagger';

export class GetNotificationsDto {
  @ApiProperty()
  username: string;
}

class Notifications {
  @ApiProperty()
  id: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  category: string;
}

export class GetNotificationsResponseDto {
  @ApiProperty({ type: [Notifications] })
  notifications: Array<Notifications>;
}