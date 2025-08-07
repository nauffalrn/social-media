import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { notification } from 'src/infrastructure/database/schema';
import { db } from 'src/infrastructure/database';
import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterDrizzleOrm } from '@nestjs-cls/transactional-adapter-drizzle-orm';

type DrizzleClient = typeof db;
type MyDrizzleAdapter = TransactionalAdapterDrizzleOrm<DrizzleClient>;

@Injectable()
export class NotificationsRepository {
  constructor(private readonly txHost: TransactionHost<MyDrizzleAdapter>) {}

  async getUserNotifications(userId: bigint, take: number, offset: number) {
    return this.txHost.tx
      .select()
      .from(notification)
      .where(eq(notification.user_id, userId))
      .limit(take)
      .offset(offset);
  }

  async insertNotification(notificationData: any) {
    return this.txHost.tx.insert(notification).values(notificationData);
  }

  async deleteNotificationById(notificationId: bigint) {
    return this.txHost.tx.delete(notification).where(eq(notification.id, notificationId));
  }
}