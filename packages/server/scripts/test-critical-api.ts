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
  
  console.log('考试:', exam.name, 'gradeId:', exam.gradeId);
  
  // 获取线位配置
  const scoreLines = await prisma.score_lines.findMany({
    where: {
      gradeId: exam.gradeId,
      isActive: true,
    },
  });
  
  console.log('线位配置:', scoreLines.map(l => ({ name: l.name, value: l.scoreValue })));
  
  // 模拟API返回
  const result = {
    exam: { id: exam.id, name: exam.name, gradeName: exam.grades?.name },
    lines: scoreLines.map((l) => ({ name: l.name, type: l.type, value: l.scoreValue })),
    range: 10,
    students: [],
  };
  
  console.log('\nAPI返回结果:');
  console.log('lines:', JSON.stringify(result.lines, null, 2));
  console.log('lines.length:', result.lines.length);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
