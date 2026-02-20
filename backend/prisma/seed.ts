import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding love_scrum_dev...');

  // Dev user
  const hashedPassword = await bcrypt.hash('dev123', 10);
  const user = await prisma.user.upsert({
    where: { email: 'dev@love-scrum.local' },
    update: {},
    create: {
      email: 'dev@love-scrum.local',
      password: hashedPassword,
      name: 'Dev User',
    },
  });
  console.log('User:', user.email, '/ password: dev123');

  // Test moments
  await prisma.moment.createMany({
    skipDuplicates: true,
    data: [
      {
        title: 'Cà phê sáng Highlands',
        caption: 'Cùng nhau uống cà phê buổi sáng',
        date: new Date('2026-01-15'),
        location: 'Highlands Coffee, Quận 1',
        latitude: 10.7762,
        longitude: 106.701,
        tags: ['cafe', 'morning'],
      },
      {
        title: 'Dạo biển Vũng Tàu',
        caption: 'Trip đầu năm 2026',
        date: new Date('2026-02-01'),
        location: 'Bãi Sau, Vũng Tàu',
        latitude: 10.34,
        longitude: 107.084,
        tags: ['beach', 'trip'],
      },
    ],
  });
  console.log('Moments: 2 created');

  // Test food spots
  await prisma.foodSpot.createMany({
    skipDuplicates: true,
    data: [
      {
        name: 'Phở Hòa Pasteur',
        description: 'Phở nổi tiếng Sài Gòn',
        rating: 4.5,
        location: '260C Pasteur, Quận 3',
        latitude: 10.7756,
        longitude: 106.689,
        tags: ['pho', 'breakfast'],
        priceRange: 2,
      },
      {
        name: 'Bún bò Huế O Xuân',
        description: 'Bún bò chuẩn vị Huế',
        rating: 4.2,
        location: '137 Lê Thánh Tôn, Quận 1',
        latitude: 10.7741,
        longitude: 106.701,
        tags: ['bun-bo', 'lunch'],
        priceRange: 1,
      },
    ],
  });
  console.log('Food spots: 2 created');

  // Test sprint
  await prisma.sprint.create({
    data: {
      name: 'Sprint Dev Test',
      description: 'Sprint dùng để test tính năng',
      startDate: new Date('2026-02-01'),
      endDate: new Date('2026-02-28'),
      status: 'ACTIVE',
      goals: {
        create: [
          { title: 'Test goal TODO', status: 'TODO', priority: 'HIGH', order: 0 },
          { title: 'Test goal IN_PROGRESS', status: 'IN_PROGRESS', priority: 'MEDIUM', order: 1 },
          { title: 'Test goal DONE', status: 'DONE', priority: 'LOW', order: 2 },
        ],
      },
    },
  });
  console.log('Sprint: 1 created with 3 goals');

  console.log('Seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
