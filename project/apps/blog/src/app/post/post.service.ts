import {
  BadRequestException,
  ConflictException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Post, PostStatus, PostType } from '@project/shared-types';
import { PostEntity } from './post.entity';
import { PostRepository } from './post.repository';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { TAGS_MAX_COUNT } from './post.consts';
import { LikeRepository } from '../like/like.repository';
import { CommentRepository } from '../comment/comment.repository';

@Injectable()
export class PostService {
  constructor(
   private readonly postRepository: PostRepository,
  private readonly likeRepository: LikeRepository,
  private readonly commentRepository: CommentRepository,
  ) {}

  public async create(dto: CreatePostDto): Promise<Post> {
    this.validateByType(dto);

    const tags = this.normalizeTags(dto.tags);

    const now = new Date();
    const post = new PostEntity({
      id: randomUUID(),
      type: dto.type,
      authorId: dto.authorId,
      title: dto.title,
      tags,
      announcement: dto.announcement,
      text: dto.text,
      quoteText: dto.quoteText,
      quoteAuthor: dto.quoteAuthor,
      videoUrl: dto.videoUrl,
      photoUrl: dto.photoUrl,
      linkUrl: dto.linkUrl,
      linkDescription: dto.linkDescription,
      publishDate: now,
      createDate: now,
      status: PostStatus.Published,
      isRepost: false,
    });

    await this.postRepository.save(post);
    return post.toPOJO();
  }

  public async getById(id: string): Promise<Post> {
    const post = await this.postRepository.findById(id);
    if (!post) {
      throw new NotFoundException(`Публикация ${id} не найдена`);
    }
    return post.toPOJO();
  }

  public async findMany(query: {
    authorId?: string;
    type?: string;
    tag?: string;
    sort?: string;
    page?: number;
    limit?: number;
  }) {
    const all = await this.postRepository.findByFilter({
      authorId: query.authorId,
      type: query.type,
      tag: query.tag,
      status: PostStatus.Published,
    });

    const sort = query.sort ?? 'dateDesc';
    let sorted: PostEntity[];

    if (sort === 'likesDesc') {
      const enriched = await Promise.all(
        all.map(async (p) => ({
          entity: p,
          count: await this.likeRepository.countByPost(p.id),
        })),
      );
      enriched.sort(
        (a, b) =>
          b.count - a.count ||
          b.entity.publishDate.getTime() - a.entity.publishDate.getTime(),
      );
      sorted = enriched.map((e) => e.entity);
    } else if (sort === 'commentsDesc') {
      const enriched = await Promise.all(
        all.map(async (p) => ({
          entity: p,
          count: await this.commentRepository.countByPost(p.id),
        })),
      );
      enriched.sort(
        (a, b) =>
          b.count - a.count ||
          b.entity.publishDate.getTime() - a.entity.publishDate.getTime(),
      );
      sorted = enriched.map((e) => e.entity);
    } else {
      sorted = [...all].sort(
        (a, b) => b.publishDate.getTime() - a.publishDate.getTime(),
      );
    }
    const total = sorted.length;
    const page = query.page ?? 1;
    const limit = query.limit ?? 25;
    const start = (page - 1) * limit;
    const items = sorted.slice(start, start + limit).map((e) => e.toPOJO());
    return { items, total };
  }

  public async findDraftsByAuthor(authorId: string) {
   const items = await this.postRepository.findByFilter({
      authorId,
      status: PostStatus.Draft,
    });
    return { items: items.map((e) => e.toPOJO()), total: items.length };
  }

  public async update(id: string, dto: UpdatePostDto): Promise<Post> {
    const post = await this.postRepository.findById(id);
    if (!post) {
      throw new NotFoundException(`Публикация ${id} не найдена`);
    }

    if (dto.tags) {
      post.tags = this.normalizeTags(dto.tags);
    }

    Object.assign(post, {
      title: dto.title ?? post.title,
      announcement: dto.announcement ?? post.announcement,
      text: dto.text ?? post.text,
      quoteText: dto.quoteText ?? post.quoteText,
      quoteAuthor: dto.quoteAuthor ?? post.quoteAuthor,
      videoUrl: dto.videoUrl ?? post.videoUrl,
      photoUrl: dto.photoUrl ?? post.photoUrl,
      linkUrl: dto.linkUrl ?? post.linkUrl,
      linkDescription: dto.linkDescription ?? post.linkDescription,
      publishDate: dto.publishDate ?? post.publishDate,
    });

    await this.postRepository.save(post);
    return post.toPOJO();
  }

  public async delete(id: string): Promise<void> {
    const deleted = await this.postRepository.delete(id);
    if (!deleted) {
      throw new NotFoundException(`Публикация ${id} не найдена`);
    }
  }

  public async repost(id: string, newAuthorId: string): Promise<Post> {
    const original = await this.postRepository.findById(id);
    if (!original) {
      throw new NotFoundException(`Оригинальная публикация ${id} не найдена`);
    }

    const existing = await this.postRepository.findByAuthor(newAuthorId);
    if (existing.some((p) => p.isRepost && p.originalPostId === id)) {
      throw new ConflictException('Вы уже делали репост этой публикации');
    }

    const now = new Date();
    const copy = new PostEntity({
      ...original.toPOJO(),
      id: randomUUID(),
      authorId: newAuthorId,
      originalAuthorId: original.authorId,
      originalPostId: original.id,
      isRepost: true,
      publishDate: now,
      createDate: now,
      status: PostStatus.Published,
    });

    await this.postRepository.save(copy);
    return copy.toPOJO();
  }

  private validateByType(dto: CreatePostDto): void {
    switch (dto.type) {
      case PostType.Video:
        if (!dto.title || !dto.videoUrl) {
          throw new BadRequestException(
            'Для видео обязательны title и videoUrl',
          );
        }
        break;
      case PostType.Text:
        if (!dto.title || !dto.announcement || !dto.text) {
          throw new BadRequestException(
            'Для текста обязательны title, announcement, text',
          );
        }
        break;
      case PostType.Quote:
        if (!dto.quoteText || !dto.quoteAuthor) {
          throw new BadRequestException(
            'Для цитаты обязательны quoteText и quoteAuthor',
          );
        }
        break;
      case PostType.Photo:
        if (!dto.photoUrl) {
          throw new BadRequestException('Для фото обязателен photoUrl');
        }
        break;
      case PostType.Link:
        if (!dto.linkUrl) {
          throw new BadRequestException('Для ссылки обязателен linkUrl');
        }
        break;
    }
  }

  private normalizeTags(tags?: string[]): string[] {
    if (!tags || tags.length === 0) {
      return [];
    }
    if (tags.length > TAGS_MAX_COUNT) {
      throw new BadRequestException(`Максимум ${TAGS_MAX_COUNT} тегов`);
    }
    const lowered = tags.map((t) => t.toLowerCase().trim());
    return [...new Set(lowered)];
  }
}
