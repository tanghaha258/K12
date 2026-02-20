import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function main() {
  console.log('开始初始化数据库...');

  // 1. 创建年级
  let grade = await prisma.grades.findFirst({
    where: { name: '高一' },
  });

  if (!grade) {
    grade = await prisma.grades.create({
      data: {
        id: uuidv4(),
        name: '高一',
        entryYear: 2024,
        updatedAt: new Date(),
      },
    });
    console.log(`创建年级: ${grade.name}`);
  } else {
    console.log(`年级已存在: ${grade.name}`);
  }

  // 2. 创建班级
  let classInfo = await prisma.classes.findFirst({
    where: { gradeId: grade.id, name: '1班' },
  });

  if (!classInfo) {
    classInfo = await prisma.classes.create({
      data: {
        id: uuidv4(),
        name: '1班',
        fullName: '高一1班',
        gradeId: grade.id,
        updatedAt: new Date(),
      },
    });
    console.log(`创建班级: ${classInfo.name}`);
  } else {
    console.log(`班级已存在: ${classInfo.name}`);
  }

  // 3. 创建科目
  const defaultSubjects = [
    { code: 'YW', name: '语文', maxScore: 150 },
    { code: 'SX', name: '数学', maxScore: 150 },
    { code: 'YY', name: '英语', maxScore: 150 },
    { code: 'WL', name: '物理', maxScore: 100 },
    { code: 'HX', name: '化学', maxScore: 100 },
    { code: 'SW', name: '生物', maxScore: 100 },
    { code: 'ZZ', name: '政治', maxScore: 100 },
    { code: 'LS', name: '历史', maxScore: 100 },
    { code: 'DL', name: '地理', maxScore: 100 },
  ];

  for (const subj of defaultSubjects) {
    const existing = await prisma.subjects.findFirst({
      where: { code: subj.code },
    });

    if (!existing) {
      await prisma.subjects.create({
        data: {
          id: uuidv4(),
          code: subj.code,
          name: subj.name,
          maxScore: subj.maxScore,
          updatedAt: new Date(),
        },
      });
      console.log(`创建科目: ${subj.name}`);
    } else {
      // 更新满分
      await prisma.subjects.update({
        where: { id: existing.id },
        data: { maxScore: subj.maxScore },
      });
      console.log(`更新科目满分: ${subj.name} = ${subj.maxScore}分`);
    }
  }

  // 4. 创建学生
  const studentsData = [
    { studentNo: '123456789', name: '唐哈哈', gender: 'male' },
    { studentNo: '123414324', name: '陈哈哈', gender: 'female' },
  ];

  for (const studentData of studentsData) {
    const existingStudent = await prisma.students.findFirst({
      where: { studentNo: studentData.studentNo },
    });

    if (!existingStudent) {
      // 创建用户
      const user = await prisma.users.create({
        data: {
          id: uuidv4(),
          account: studentData.studentNo,
          password: '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQzBZN0UfGNEKjN3Z7vYJyr1mJq', // 123456
          name: studentData.name,
          role: 'STUDENT',
          status: 'ACTIVE',
          updatedAt: new Date(),
        },
      });

      // 创建学生
      await prisma.students.create({
        data: {
          id: uuidv4(),
          userId: user.id,
          studentNo: studentData.studentNo,
          gender: studentData.gender,
          entryYear: 2024,
          gradeId: grade.id,
          classId: classInfo.id,
          updatedAt: new Date(),
        },
      });
      console.log(`创建学生: ${studentData.name}`);
    } else {
      console.log(`学生已存在: ${studentData.name}`);
    }
  }

  // 5. 创建考试
  let exam = await prisma.exams.findFirst({
    where: { gradeId: grade.id, name: '2024-2025学年第一学期期中考试' },
  });

  if (!exam) {
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
  } else {
    console.log(`考试已存在: ${exam.name}`);
  }

  // 6. 创建考试科目
  const allSubjects = await prisma.subjects.findMany();
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
          maxScore: subj.maxScore,
          weight: 1,
          includeInTotal: true,
          includeInRank: true,
        },
      });
    }
    console.log('考试科目创建完成');
  } else {
    console.log('考试科目已存在');
  }

  // 7. 生成成绩
  const students = await prisma.students.findMany({
    where: { classId: classInfo.id },
    include: { users: true },
  });

  const examSubjectsList = await prisma.exam_subjects.findMany({
    where: { examId: exam.id },
  });

  // 删除旧成绩
  await prisma.scores.deleteMany({
    where: { examId: exam.id },
  });

  console.log('生成成绩...');
  for (const student of students) {
    for (const examSubj of examSubjectsList) {
      const baseScore = Math.floor(Math.random() * 40) + 50;
      const maxScore = examSubj.maxScore;
      const score = Math.min(maxScore, Math.floor(baseScore * (maxScore / 100)));

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

  // 8. 创建分段规则
  const segmentExists = await prisma.score_segments.findFirst({
    where: { gradeId: grade.id, isDefault: true },
  });

  if (!segmentExists) {
    await prisma.score_segments.create({
      data: {
        id: uuidv4(),
        name: '高一默认分段规则',
        gradeId: grade.id,
        excellentMin: 90,
        goodMin: 80,
        passMin: 60,
        failMax: 59,
        isDefault: true,
        isActive: true,
        updatedAt: new Date(),
      },
    });
    console.log('创建分段规则');
  }

  // 9. 创建分数线
  const lineExists = await prisma.score_lines.findFirst({
    where: { gradeId: grade.id, type: 'ONE_BOOK' },
  });

  if (!lineExists) {
    await prisma.score_lines.create({
      data: {
        id: uuidv4(),
        name: '一本线',
        type: 'ONE_BOOK',
        gradeId: grade.id,
        scoreValue: 520,
        isActive: true,
        updatedAt: new Date(),
      },
    });
    console.log('创建一本线');
  }

  const regularLineExists = await prisma.score_lines.findFirst({
    where: { gradeId: grade.id, type: 'REGULAR' },
  });

  if (!regularLineExists) {
    await prisma.score_lines.create({
      data: {
        id: uuidv4(),
        name: '普高线',
        type: 'REGULAR',
        gradeId: grade.id,
        scoreValue: 400,
        isActive: true,
        updatedAt: new Date(),
      },
    });
    console.log('创建普高线');
  }

  console.log('\n=== 数据初始化完成 ===');
  console.log(`年级: ${grade.name}`);
  console.log(`班级: ${classInfo.name}`);
  console.log(`学生数: ${students.length}`);
  console.log(`科目数: ${allSubjects.length}`);
  console.log(`考试: ${exam.name}`);
  console.log(`成绩记录数: ${students.length * examSubjectsList.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
