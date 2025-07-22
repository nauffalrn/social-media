import { ApiProperty } from '@nestjs/swagger';

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