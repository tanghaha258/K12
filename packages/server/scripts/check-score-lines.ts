import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('检查线位配置...');
  
  const grade = await prisma.grades.findFirst({
    where: { name: '高一' },
  });
  
  if (!grade) {
    console.log('未找到高一');
    return;
  }
  
  const lines = await prisma.score_lines.findMany({
    where: {
      gradeId: grade.id,
      isActive: true,
    },
  });
  
  console.log('高一活跃线位配置:', lines);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
