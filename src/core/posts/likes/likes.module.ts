import { Module } from '@nestjs/common';
import { DbModule } from 'src/infrastructure/database/db.module';
import { LikesController } from './likes.controller';
import { LikesService } from './likes.service';
import { LikeRepository } from './repositories/like.repository';

@Module({
  imports: [DbModule],
  controllers: [LikesController],
  providers: [LikesService, LikeRepository],
  exports: [LikesService, LikeRepository],
})
export class LikesModule {}
