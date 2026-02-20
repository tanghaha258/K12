import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('检查考试和线位配置...');
  
  // 获取考试
  const exams = await prisma.exams.findMany({
    include: {
      grades: true,
    },
  });
  
  console.log('\n考试列表:');
  for (const exam of exams) {
    console.log(`  ${exam.name}: gradeId=${exam.gradeId}, grades.name=${exam.grades?.name}`);
  }
  
  // 获取线位配置
  const lines = await prisma.score_lines.findMany();
  
  console.log('\n线位配置:');
  for (const line of lines) {
    console.log(`  ${line.name}: gradeId=${line.gradeId}, scoreValue=${line.scoreValue}, isActive=${line.isActive}`);
  }
  
  // 检查匹配
  for (const exam of exams) {
    const matchingLines = lines.filter(l => l.gradeId === exam.gradeId);
    console.log(`\n考试 "${exam.name}" 匹配的线位: ${matchingLines.length} 个`);
    for (const l of matchingLines) {
      console.log(`  - ${l.name} (${l.scoreValue}分)`);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
