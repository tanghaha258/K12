import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkHuangUser() {
  // 查找黄哈哈
  const user = await prisma.user.findFirst({
    where: { name: '黄哈哈' },
    include: {
      roleRef: true,
    },
  });

  console.log('黄哈哈用户信息:');
  console.log(JSON.stringify(user, null, 2));

  // 检查所有用户
  const allUsers = await prisma.user.findMany({
    include: {
      roleRef: true,
    },
  });

  console.log('\n所有用户:');
  allUsers.forEach((u) => {
    console.log(`  ${u.name} (${u.account}): role=${u.role}, roleId=${u.roleId}, roleRef=${u.roleRef?.name || 'null'}`);
  });
}

checkHuangUser()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
