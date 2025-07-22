import { Module } from '@nestjs/common';
import { DbModule } from 'src/infrastructure/database/db.module';
import { UsersModule } from '../users/users.module';
import { FollowsController } from './follows.controller';
import { FollowsService } from './follows.service';

@Module({
  imports: [UsersModule, DbModule],
  controllers: [FollowsController],
  providers: [FollowsService],
  exports: [FollowsService],
})
export class FollowsModule {}
