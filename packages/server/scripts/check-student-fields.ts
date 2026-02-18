import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkStudentFields() {
  // 查找陈哈哈的学生记录
  const student = await prisma.student.findFirst({
    where: {
      user: {
        name: '陈哈哈'
      }
    },
    include: {
      user: true,
      grade: true,
      class: true,
    }
  });

  console.log('陈哈哈学生记录:');
  console.log(JSON.stringify(student, null, 2));
}

checkStudentFields()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
