import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { CommentRepository } from './comment.repository';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CommentEntity } from './comment.entity';

@Injectable()
export class CommentService {
  constructor(private readonly commentRepository: CommentRepository) {}

  public async create(postId: string, userId: string, dto: CreateCommentDto) {
    const comment = new CommentEntity({
      id: randomUUID(),
      postId,
      userId,
      text: dto.text,
      createDate: new Date(),
    });
    return this.commentRepository.save(comment);
  }

  public async findByPost(postId: string, page?: number, limit?: number) {
    return this.commentRepository.findByPost(postId, page, limit);
  }

  public async delete(commentId: string, userId: string): Promise<void> {
    const comment = await this.commentRepository.findById(commentId);
    if (!comment) {
      throw new NotFoundException(`Комментарий ${commentId} не найден`);
    }
    if (comment.userId !== userId) {
      throw new ForbiddenException('Нельзя удалить чужой комментарий');
    }
    await this.commentRepository.delete(commentId);
  }

  public async countByPost(postId: string): Promise<number> {
    return this.commentRepository.countByPost(postId);
  }
}