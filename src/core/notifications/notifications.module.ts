import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { DbModule } from 'src/infrastructure/database/db.module';
import { NotificationsRepository } from './repositories/notification.repository';

@Module({
  imports: [DbModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsRepository],
  exports: [NotificationsService, NotificationsRepository],
})
export class NotificationsModule {}