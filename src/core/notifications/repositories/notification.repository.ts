import { Injectable, Inject } from '@nestjs/common';
import { db } from 'src/infrastructure/database';
import { notification } from 'src/infrastructure/database/schema';
import { eq, desc } from 'drizzle-orm';

type DrizzleClient = typeof db;

@Injectable()
export class NotificationRepository {
  constructor(
    @Inject('DATABASE_CONNECTION') private readonly db: DrizzleClient,
  ) {}

  async getUserNotifications(userId: bigint, take: number, offset: number) {
    return this.db
      .select()
      .from(notification)
      .where(eq(notification.user_id, userId))
      .orderBy(desc(notification.id))
      .limit(take)
      .offset(offset);
  }

  async insertNotification(data: any) {
    return this.db.insert(notification).values(data);
  }
}
