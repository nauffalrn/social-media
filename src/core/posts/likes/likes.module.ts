import { Module } from '@nestjs/common';
import { LikesController } from './likes.controller';
import { LikesService } from './likes.service';
import { LikeRepository } from './repositories/like.repository';
import { DbModule } from 'src/infrastructure/database/db.module';

@Module({
  imports: [DbModule],
  controllers: [LikesController],
  providers: [LikesService, LikeRepository],
  exports: [LikeRepository],
})
export class LikesModule {}
