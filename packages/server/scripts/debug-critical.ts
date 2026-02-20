import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 获取考试
  const exam = await prisma.exams.findFirst({
    include: { grades: true },
  });
  
  if (!exam) {
    console.log('没有考试');
    return;
  }
  
  console.log('考试信息:');
  console.log('  id:', exam.id);
  console.log('  name:', exam.name);
  console.log('  gradeId:', exam.gradeId);
  console.log('  grades.id:', exam.grades?.id);
  console.log('  grades.name:', exam.grades?.name);
  
  // 获取线位配置
  const scoreLines = await prisma.score_lines.findMany({
    where: {
      gradeId: exam.gradeId,
      isActive: true,
    },
  });
  
  console.log('\n线位配置 (gradeId=' + exam.gradeId + '):');
  console.log('  数量:', scoreLines.length);
  scoreLines.forEach(l => {
    console.log('  -', l.name, l.scoreValue, '分, type:', l.type, ', isActive:', l.isActive);
  });
  
  // 检查所有线位配置
  const allLines = await prisma.score_lines.findMany();
  console.log('\n所有线位配置:');
  allLines.forEach(l => {
    console.log('  -', l.name, 'gradeId:', l.gradeId, 'value:', l.scoreValue);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
