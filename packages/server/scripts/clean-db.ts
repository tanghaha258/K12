import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('开始清理脏数据...');

  // 查找名称异常的年级
  const badGrades = await prisma.grades.findMany({
    where: {
      OR: [
        { name: { contains: 'PATCH' } },
        { name: { contains: 'DELETE' } },
        { name: { contains: '????' } },
        { name: { contains: 'null' } },
      ],
    },
  });

  console.log(`找到 ${badGrades.length} 条异常年级数据:`, badGrades);

  for (const grade of badGrades) {
    console.log(`处理年级: ${grade.name} (${grade.id})`);

    // 删除 score_lines
    await prisma.score_lines.deleteMany({
      where: { gradeId: grade.id },
    });
    console.log('已删除 score_lines');

    // 删除 score_segments
    await prisma.score_segments.deleteMany({
      where: { gradeId: grade.id },
    });
    console.log('已删除 score_segments');

    // 删除 subject_grades
    await prisma.subject_grades.deleteMany({
      where: { gradeId: grade.id },
    });
    console.log('已删除 subject_grades');

    // 删除 exams
    await prisma.exams.deleteMany({
      where: { gradeId: grade.id },
    });
    console.log('已删除 exams');

    // 删除 students
    const students = await prisma.students.findMany({
      where: { gradeId: grade.id },
    });

    for (const student of students) {
      // 先删除学生记录
      await prisma.students.delete({
        where: { id: student.id },
      });
      // 删除学生的数据范围
      await prisma.data_scopes.deleteMany({
        where: { userId: student.userId },
      });
      // 删除学生用户
      await prisma.users.delete({
        where: { id: student.userId },
      });
    }
    console.log('已删除 students');

    // 查找该年级下的班级
    const classes = await prisma.classes.findMany({
      where: { gradeId: grade.id },
    });

    console.log(`找到 ${classes.length} 个关联班级`);

    for (const cls of classes) {
      // 删除班级下的学生相关数据
      await prisma.student_profile_history.deleteMany({
        where: { classId: cls.id },
      });

      // 删除教师班级关联
      await prisma.teacher_classes.deleteMany({
        where: { classId: cls.id },
      });
    }

    // 删除班级
    await prisma.classes.deleteMany({
      where: { gradeId: grade.id },
    });
    console.log('已删除 classes');

    // 删除年级
    await prisma.grades.delete({
      where: { id: grade.id },
    });

    console.log(`已删除年级: ${grade.name}`);
  }

  console.log('清理完成！');
}

main()
  .catch((e) => {
    console.error('清理失败', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
