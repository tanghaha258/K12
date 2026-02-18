import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUserApi() {
  // 模拟 findAll 方法查询陈哈哈
  const user = await prisma.user.findFirst({
    where: { name: '陈哈哈' },
    include: {
      student: {
        include: {
          grade: true,
          class: true,
        },
      },
      teacher: true,
      roleRef: true,
    },
  });

  console.log('User object:');
  console.log(JSON.stringify(user, null, 2));
  
  console.log('\nStudent object:');
  console.log(JSON.stringify(user?.student, null, 2));
  
  console.log('\nGradeId from student:', user?.student?.gradeId);
  console.log('ClassId from student:', user?.student?.classId);
}

checkUserApi()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
