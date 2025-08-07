import { Injectable } from '@nestjs/common';
import { Either, left, right } from 'src/libs/helpers/either';
import { NotificationsRepository } from './repositories/notification.repository';
import { GetNotificationsResponseDto } from './useCases/getNotifications/dto/get-notifications-response.dto';

// Definisi tipe result
type GetUserNotificationsResult = Either<Error, GetNotificationsResponseDto>;

@Injectable()
export class NotificationsService {
  constructor(
    private readonly notificationsRepository: NotificationsRepository,
  ) {}

  async getUserNotifications(
    userId: bigint,
    take = 30,
    page = 1,
  ): Promise<GetUserNotificationsResult> {
    try {
      const offset = (page - 1) * take;
      const notifications =
        await this.notificationsRepository.getUserNotifications(
          userId,
          take,
          offset,
        );

      const mappedNotifications = notifications.map((n) => ({
        id: n.id.toString(),
        description: n.description,
        category: n.category,
      }));

      return right({ notifications: mappedNotifications });
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return left(new Error('Gagal mengambil notifikasi'));
    }
  }
}
