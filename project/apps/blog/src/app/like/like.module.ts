import { Module } from '@nestjs/common';
import { LikeRepository } from './like.repository';
import { LikeService } from './like.service';
import { LikeController } from './like.controller';

@Module({
  controllers: [LikeController],
  providers: [LikeRepository, LikeService],
  exports: [LikeRepository, LikeService],
})
export class LikeModule {}