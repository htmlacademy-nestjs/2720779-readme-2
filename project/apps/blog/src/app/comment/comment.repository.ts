import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CommentEntity } from './comment.entity';

@Injectable()
export class CommentRepository {
  constructor(private readonly prisma: PrismaService) {}

  public async save(entity: CommentEntity): Promise<CommentEntity> {
    const created = await this.prisma.comment.create({
      data: {
        id: entity.id || undefined,
        postId: entity.postId,
        userId: entity.userId,
        text: entity.text,
        createDate: entity.createDate,
      },
    });
    return this.toEntity(created);
  }

  public async findById(id: string): Promise<CommentEntity | null> {
    const comment = await this.prisma.comment.findUnique({ where: { id } });
    return comment ? this.toEntity(comment) : null;
  }

  public async delete(id: string): Promise<boolean> {
    try {
      await this.prisma.comment.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }

  public async findByPost(
    postId: string,
    page = 1,
    limit = 50,
  ): Promise<{ items: CommentEntity[]; total: number }> {
    const where = { postId };
    const [comments, total] = await Promise.all([
      this.prisma.comment.findMany({
        where,
        orderBy: { createDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.comment.count({ where }),
    ]);
    return { items: comments.map((c) => this.toEntity(c)), total };
  }

  public async countByPost(postId: string): Promise<number> {
    return this.prisma.comment.count({ where: { postId } });
  }

  private toEntity(comment: {
    id: string;
    postId: string;
    userId: string;
    text: string;
    createDate: Date;
  }): CommentEntity {
    return CommentEntity.fromObject({
      id: comment.id,
      postId: comment.postId,
      userId: comment.userId,
      text: comment.text,
      createDate: comment.createDate,
    });
  }
}