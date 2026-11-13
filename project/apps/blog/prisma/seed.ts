import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
async function main() {
  await prisma.like.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.post.deleteMany();

  const first = await prisma.post.create({
    data: {
      type: 'text',
      authorId: 'seed-user-1',
      title: 'Первый пост для теста сортировки',
      announcement: 'Анонс первого поста, достаточно длинный для проверки',
      text: 'Текст первого поста, достаточно длинный для проверки работы seed-скрипта и сортировки.',
      tags: ['nestjs', 'backend'],
      status: 'published',
    },
  });

  const second = await prisma.post.create({
    data: {
      type: 'quote',
      authorId: 'seed-user-2',
      quoteText: 'Простота — залог надёжности',
      quoteAuthor: 'Неизвестный автор',
      tags: ['quote'],
      status: 'published',
    },
  });

  const third = await prisma.post.create({
    data: {
      type: 'link',
      authorId: 'seed-user-1',
      linkUrl: 'https://nestjs.com',
      linkDescription: 'Официальный сайт NestJS',
      tags: ['nestjs', 'docs'],
      status: 'published',
    },
  });

  await prisma.comment.create({
    data: {
      postId: first.id,
      userId: 'seed-user-2',
      text: 'Отличный первый пост, спасибо!',
    },
  });

  await prisma.like.create({
    data: { userId: 'seed-user-2', postId: first.id },
  });
  await prisma.like.create({
    data: { userId: 'seed-user-3', postId: first.id },
  });
  await prisma.like.create({
    data: { userId: 'seed-user-2', postId: second.id },
  });

  console.log('Seed completed:', {
    posts: [first.id, second.id, third.id],
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });