import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LikeEntity } from './like.entity';

@Injectable()
export class LikeRepository {
  constructor(private readonly prisma: PrismaService) {}

  public async save(entity: LikeEntity): Promise<LikeEntity> {
    const created = await this.prisma.like.create({
      data: {
        userId: entity.userId,
        postId: entity.postId,
        createDate: entity.createDate,
      },
    });
    return LikeEntity.fromObject(created);
  }

  public async delete(userId: string, postId: string): Promise<boolean> {
    try {
      await this.prisma.like.delete({
        where: { userId_postId: { userId, postId } },
      });
      return true;
    } catch {
      return false;
    }
  }

  public async exists(userId: string, postId: string): Promise<boolean> {
    const like = await this.prisma.like.findUnique({
      where: { userId_postId: { userId, postId } },
      select: { userId: true },
    });
    return like !== null;
  }

  public async countByPost(postId: string): Promise<number> {
    return this.prisma.like.count({ where: { postId } });
  }

  public async deleteByPost(postId: string): Promise<void> {
    await this.prisma.like.deleteMany({ where: { postId } });
  }
}