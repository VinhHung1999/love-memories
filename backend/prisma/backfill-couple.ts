import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const dbUrl = process.env.DATABASE_URL || 'unknown';
  console.log(`Backfilling coupleId on: ${dbUrl.replace(/\/\/.*@/, '//***@')}`);

  // 1. Create default couple (or reuse existing one)
  let couple = await prisma.couple.findFirst();
  if (!couple) {
    couple = await prisma.couple.create({
      data: { name: 'Hung & Nhu' },
    });
  }
  console.log(`Couple: ${couple.id} (${couple.name})`);

  // 2. Assign all users
  const userResult = await prisma.user.updateMany({
    where: { coupleId: null },
    data: { coupleId: couple.id },
  });
  console.log(`Users updated: ${userResult.count}`);

  // 3. Backfill all 14 remaining models
  const models = [
    'moment',
    'foodSpot',
    'recipe',
    'cookingSession',
    'sprint',
    'goal',
    'datePlan',
    'dateWish',
    'expense',
    'loveLetter',
    'customAchievement',
    'tag',
    'appSetting',
    'achievement',
  ] as const;

  for (const model of models) {
    const result = await (prisma[model] as any).updateMany({
      where: { coupleId: null },
      data: { coupleId: couple.id },
    });
    console.log(`${model}: ${result.count} rows updated`);
  }

  console.log('Backfill complete.');
}

main()
  .catch((e) => {
    console.error('Backfill failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
