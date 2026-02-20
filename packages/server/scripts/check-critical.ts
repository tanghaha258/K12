import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('检查学生成绩数据...');
  
  // 获取考试
  const exam = await prisma.exams.findFirst();
  if (!exam) {
    console.log('没有考试数据');
    return;
  }
  
  console.log(`考试: ${exam.name} (id=${exam.id})`);
  
  // 获取学生总分
  const scores = await prisma.scores.findMany({
    where: { examId: exam.id },
    include: {
      students: {
        select: {
          id: true,
          studentNo: true,
          users: { select: { name: true } },
        },
      },
      exam_subjects: { select: { includeInTotal: true } },
    },
  });
  
  const studentTotals = new Map<string, { name: string; totalScore: number }>();
  
  scores.forEach((s) => {
    if (!studentTotals.has(s.studentId)) {
      studentTotals.set(s.studentId, {
        name: s.students.users.name,
        totalScore: 0,
      });
    }
    if (!s.isAbsent && s.exam_subjects.includeInTotal) {
      studentTotals.get(s.studentId)!.totalScore += s.rawScore;
    }
  });
  
  console.log(`\n学生总数: ${studentTotals.size}`);
  
  // 显示学生总分分布
  const totals = Array.from(studentTotals.entries()).map(([id, data]) => ({
    name: data.name,
    totalScore: data.totalScore,
  })).sort((a, b) => b.totalScore - a.totalScore);
  
  console.log('\n学生总分（前10名）:');
  totals.slice(0, 10).forEach((s, i) => {
    console.log(`  ${i + 1}. ${s.name}: ${s.totalScore}分`);
  });
  
  // 检查临界生
  const lines = [
    { name: '123', value: 500 },
    { name: '345', value: 420 },
  ];
  const range = 10;
  
  console.log('\n临界生分析（浮动范围=10）:');
  for (const line of lines) {
    const critical = totals.filter(s => 
      s.totalScore >= line.value - range && s.totalScore <= line.value + range
    );
    console.log(`  ${line.name}线 (${line.value}分): ${critical.length}人`);
    critical.forEach(s => {
      const distance = s.totalScore - line.value;
      console.log(`    - ${s.name}: ${s.totalScore}分 (${distance > 0 ? '+' : ''}${distance}分)`);
    });
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
