import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkChenData() {
  // 查找陈哈哈
  const user = await prisma.user.findFirst({
    where: { name: '陈哈哈' },
    include: {
      student: {
        include: {
          grade: true,
          class: true,
        },
      },
    },
  });

  console.log('陈哈哈用户信息:');
  console.log(JSON.stringify(user, null, 2));

  // 检查数据范围
  const dataScopes = await prisma.dataScope.findMany({
    where: { userId: user?.id },
  });
  console.log('\n数据范围:');
  console.log(JSON.stringify(dataScopes, null, 2));
}

checkChenData()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
