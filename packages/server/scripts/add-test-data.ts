import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function main() {
  console.log('开始添加测试数据...');

  const grade = await prisma.grades.findFirst({
    where: { name: { contains: '高一' } },
  });

  if (!grade) {
    console.log('未找到高一年级，请先创建年级');
    return;
  }

  console.log(`找到年级: ${grade.name}`);

  const classInfo = await prisma.classes.findFirst({
    where: { gradeId: grade.id, name: { contains: '1班' } },
  });

  if (!classInfo) {
    console.log('未找到高一1班');
    return;
  }

  console.log(`找到班级: ${classInfo.name}`);

  const students = await prisma.students.findMany({
    where: { classId: classInfo.id },
    include: { users: true },
  });

  console.log(`班级学生数: ${students.length}`);

  if (students.length === 0) {
    console.log('班级没有学生，无法添加成绩');
    return;
  }

  const subjects = await prisma.subjects.findMany();
  console.log(`科目数: ${subjects.length}`);

  if (subjects.length === 0) {
    console.log('没有科目，先创建基础科目...');
    const defaultSubjects = [
      { code: 'YW', name: '语文' },
      { code: 'SX', name: '数学' },
      { code: 'YY', name: '英语' },
      { code: 'WL', name: '物理' },
      { code: 'HX', name: '化学' },
      { code: 'SW', name: '生物' },
      { code: 'ZZ', name: '政治' },
      { code: 'LS', name: '历史' },
      { code: 'DL', name: '地理' },
    ];

    for (const subj of defaultSubjects) {
      await prisma.subjects.create({
        data: {
          id: uuidv4(),
          code: subj.code,
          name: subj.name,
          updatedAt: new Date(),
        },
      });
    }
    console.log('基础科目创建完成');
  }

  const allSubjects = await prisma.subjects.findMany();

  const existingExam = await prisma.exams.findFirst({
    where: { gradeId: grade.id, name: '2024-2025学年第一学期期中考试' },
  });

  let exam;
  if (existingExam) {
    exam = existingExam;
    console.log(`考试已存在: ${exam.name}`);
  } else {
    exam = await prisma.exams.create({
      data: {
        id: uuidv4(),
        name: '2024-2025学年第一学期期中考试',
        type: 'midterm',
        term: '2024-2025-1',
        schoolYear: '2024-2025',
        gradeId: grade.id,
        status: 'published',
        updatedAt: new Date(),
      },
    });
    console.log(`创建考试: ${exam.name}`);
  }

  const examSubjects = await prisma.exam_subjects.findMany({
    where: { examId: exam.id },
  });

  if (examSubjects.length === 0) {
    console.log('创建考试科目...');
    for (const subj of allSubjects) {
      await prisma.exam_subjects.create({
        data: {
          id: uuidv4(),
          examId: exam.id,
          subjectId: subj.id,
          maxScore: 100,
          weight: 1,
          includeInTotal: true,
          includeInRank: true,
        },
      });
    }
    console.log('考试科目创建完成');
  }

  const existingScores = await prisma.scores.findMany({
    where: { examId: exam.id },
  });

  if (existingScores.length > 0) {
    console.log(`删除旧的 ${existingScores.length} 条成绩记录...`);
    await prisma.scores.deleteMany({
      where: { examId: exam.id },
    });
  }

  const examSubjectsList = await prisma.exam_subjects.findMany({
    where: { examId: exam.id },
  });

  console.log('考试科目列表:', examSubjectsList.map(es => ({ id: es.id, subjectId: es.subjectId })));

  console.log('为学生生成随机成绩...');

  for (const student of students) {
    for (const examSubj of examSubjectsList) {
      const baseScore = Math.floor(Math.random() * 40) + 50;
      const score = Math.min(100, baseScore + Math.floor(Math.random() * 20));

      await prisma.scores.create({
        data: {
          id: uuidv4(),
          studentId: student.id,
          examId: exam.id,
          subjectId: examSubj.id,
          rawScore: score,
          isAbsent: false,
          updatedAt: new Date(),
        },
      });
    }
    console.log(`  ${student.users.name}: 成绩已生成`);
  }

  console.log('测试数据添加完成!');

  console.log('\n=== 数据摘要 ===');
  console.log(`年级: ${grade.name}`);
  console.log(`班级: ${classInfo.name}`);
  console.log(`学生数: ${students.length}`);
  console.log(`考试: ${exam.name}`);
  console.log(`科目数: ${allSubjects.length}`);
  console.log(`成绩记录数: ${students.length * allSubjects.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
