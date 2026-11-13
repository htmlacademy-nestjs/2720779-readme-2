import { Module } from '@nestjs/common';
import { PostRepository } from './post.repository';
import { PostService } from './post.service';
import { PostController } from './post.controller';
import { LikeModule } from '../like/like.module';
import { CommentModule } from '../comment/comment.module';

@Module({
  imports: [LikeModule, CommentModule],
  controllers: [PostController],
  providers: [PostRepository, PostService],
  exports: [PostRepository, PostService],
})
export class PostModule {}