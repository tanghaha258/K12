import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function main() {
  console.log('添加线位配置数据...');

  const grade = await prisma.grades.findFirst({
    where: { name: { contains: '高一' } },
  });

  if (!grade) {
    console.log('未找到高一年级');
    return;
  }

  const existingLines = await prisma.score_lines.findMany({
    where: { gradeId: grade.id },
  });

  if (existingLines.length > 0) {
    console.log(`已有 ${existingLines.length} 条线位配置，跳过创建`);
    return;
  }

  const lines = [
    { name: '一本线', type: 'ONE_BOOK', scoreValue: 500 },
    { name: '普高线', type: 'REGULAR', scoreValue: 400 },
    { name: '优秀线', type: 'CUSTOM', scoreValue: 600 },
  ];

  for (const line of lines) {
    await prisma.score_lines.create({
      data: {
        id: uuidv4(),
        name: line.name,
        type: line.type as any,
        gradeId: grade.id,
        scoreValue: line.scoreValue,
        isActive: true,
        updatedAt: new Date(),
      },
    });
    console.log(`创建线位: ${line.name} (${line.scoreValue}分)`);
  }

  console.log('线位配置添加完成!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
