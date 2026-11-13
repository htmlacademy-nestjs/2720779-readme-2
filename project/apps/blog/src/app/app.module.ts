import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PostModule } from './post/post.module';
import { CommentModule } from './comment/comment.module';
import { LikeModule } from './like/like.module';
import { SearchModule } from './search/search.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [SearchModule, PostModule, CommentModule, LikeModule, PrismaModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
