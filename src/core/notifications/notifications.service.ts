import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DrizzleInstance } from 'src/infrastructure/database';
import { notification } from 'src/infrastructure/database/schema';
import { Either, left, right} from 'src/libs/helpers/either';
import { GetNotificationsResponseDto } from './useCases/getNotifications/dto/get-notifications-response.dto';


// Definisi tipe result
type GetUserNotificationsResult = Either<Error, GetNotificationsResponseDto>;

@Injectable()
export class NotificationsService {
  constructor(@Inject('DB') private db: DrizzleInstance) {}

  async getUserNotifications(userId: bigint, take = 30, page = 1): Promise<GetUserNotificationsResult> {
    try {
      const offset = (page - 1) * take;

      const notifications = await this.db
        .select()
        .from(notification)
        .where(eq(notification.user_id, userId))
        .limit(take)
        .offset(offset);

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
