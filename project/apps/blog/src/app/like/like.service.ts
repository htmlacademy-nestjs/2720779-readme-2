import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { LikeEntity } from './like.entity';
import { LikeRepository } from './like.repository';

@Injectable()
export class LikeService {
  constructor(private readonly likeRepository: LikeRepository) {}

  public async like(userId: string, postId: string) {
    if (await this.likeRepository.exists(userId, postId)) {
      throw new ConflictException('Вы уже поставили лайк этой публикации');
    }
    const like = new LikeEntity({
      userId,
      postId,
      createDate: new Date(),
    });
    return this.likeRepository.save(like);
  }

  public async unlike(userId: string, postId: string): Promise<void> {
    const exists = await this.likeRepository.exists(userId, postId);
    if (!exists) {
      throw new NotFoundException('Лайк не найден');
    }
    await this.likeRepository.delete(userId, postId);
  }

  public async countByPost(postId: string): Promise<number> {
    return this.likeRepository.countByPost(postId);
  }
}