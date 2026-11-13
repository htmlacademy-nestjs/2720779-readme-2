import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PostEntity } from './post.entity';
import { Post, PostStatus } from '@project/shared-types';

@Injectable()
export class PostRepository {
  constructor(private readonly prisma: PrismaService) {}

  public async save(entity: PostEntity): Promise<PostEntity> {
    const created = await this.prisma.post.create({
      data: {
        id: entity.id || undefined,
        type: entity.type,
        authorId: entity.authorId,
        title: entity.title,
        tags: entity.tags,
        announcement: entity.announcement,
        text: entity.text,
        quoteText: entity.quoteText,
        quoteAuthor: entity.quoteAuthor,
        videoUrl: entity.videoUrl,
        photoUrl: entity.photoUrl,
        linkUrl: entity.linkUrl,
        linkDescription: entity.linkDescription,
        publishDate: entity.publishDate,
        createDate: entity.createDate,
        status: entity.status,
        isRepost: entity.isRepost,
        originalPostId: entity.originalPostId,
        originalAuthorId: entity.originalAuthorId,
      },
    });
    return this.toEntity(created);
  }

  public async findById(id: string): Promise<PostEntity | null> {
    const post = await this.prisma.post.findUnique({ where: { id } });
    return post ? this.toEntity(post) : null;
  }

  public async findByFilter(filter: {
    authorId?: string;
    type?: string;
    tag?: string;
    status?: PostStatus;
  }): Promise<PostEntity[]> {
    const where: Record<string, unknown> = {};
    if (filter.status) where.status = filter.status;
    if (filter.authorId) where.authorId = filter.authorId;
    if (filter.type) where.type = filter.type;
    if (filter.tag) where.tags = { has: filter.tag };

    const posts = await this.prisma.post.findMany({ where });
    return posts.map((p) => this.toEntity(p));
  }

  public async delete(id: string): Promise<boolean> {
    try {
      await this.prisma.post.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }

  public async findByAuthor(authorId: string): Promise<PostEntity[]> {
    const posts = await this.prisma.post.findMany({ where: { authorId } });
    return posts.map((p) => this.toEntity(p));
  }

  public async findByTitle(query: string, limit = 20): Promise<PostEntity[]> {
    const posts = await this.prisma.post.findMany({
      where: {
        status: PostStatus.Published,
        title: { contains: query, mode: 'insensitive' },
      },
      take: limit,
    });
    return posts.map((p) => this.toEntity(p));
  }

  private toEntity(post: {
    id: string;
    type: string;
    authorId: string;
    title: string | null;
    tags: string[];
    announcement: string | null;
    text: string | null;
    quoteText: string | null;
    quoteAuthor: string | null;
    videoUrl: string | null;
    photoUrl: string | null;
    linkUrl: string | null;
    linkDescription: string | null;
    publishDate: Date;
    createDate: Date;
    status: string;
    isRepost: boolean;
    originalPostId: string | null;
    originalAuthorId: string | null;
  }): PostEntity {
    return PostEntity.fromObject({
      id: post.id,
      type: post.type as Post['type'],
      authorId: post.authorId,
      title: post.title ?? undefined,
      tags: post.tags,
      announcement: post.announcement ?? undefined,
      text: post.text ?? undefined,
      quoteText: post.quoteText ?? undefined,
      quoteAuthor: post.quoteAuthor ?? undefined,
      videoUrl: post.videoUrl ?? undefined,
      photoUrl: post.photoUrl ?? undefined,
      linkUrl: post.linkUrl ?? undefined,
      linkDescription: post.linkDescription ?? undefined,
      publishDate: post.publishDate,
      createDate: post.createDate,
      status: post.status as Post['status'],
      isRepost: post.isRepost,
      originalPostId: post.originalPostId ?? undefined,
      originalAuthorId: post.originalAuthorId ?? undefined,
    });
  }
}