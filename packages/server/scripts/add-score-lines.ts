import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function main() {
  console.log('添加线位配置...');

  // 为高一添加一本线
  const existingOneBook = await prisma.score_lines.findFirst({
    where: {
      gradeId: 'grade_g1',
      type: 'ONE_BOOK',
    },
  });

  if (!existingOneBook) {
    await prisma.score_lines.create({
      data: {
        id: uuidv4(),
        name: '一本线',
        type: 'ONE_BOOK',
        gradeId: 'grade_g1',
        scoreValue: 520,
        description: '一本线参考',
        isActive: true,
        updatedAt: new Date(),
      },
    });
    console.log('已为高一添加一本线 (520分)');
  } else {
    console.log('高一一本线已存在');
  }

  // 检查所有线位配置
  const allLines = await prisma.score_lines.findMany({
    orderBy: { gradeId: 'asc' },
  });

  console.log('\n当前线位配置:');
  for (const line of allLines) {
    console.log(`  ${line.name} (${line.type}): ${line.scoreValue}分 - 年级: ${line.gradeId}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
