import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { DbModule } from 'src/infrastructure/database/db.module';
import { NotificationRepository } from './repositories/notification.repository';
import { NotificationsUseCase } from './useCases/getNotification.usecase';

@Module({
  imports: [DbModule],
  controllers: [NotificationsController],
  providers: [NotificationRepository, NotificationsUseCase],
  exports: [NotificationRepository],
})
export class NotificationsModule {}
