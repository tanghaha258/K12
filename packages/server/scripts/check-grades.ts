import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('检查年级数据...');
  const grades = await prisma.grades.findMany({
    include: {
      _count: {
        select: { classes: true, students: true },
      },
    },
  });
  console.log('年级数据:', JSON.stringify(grades, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
