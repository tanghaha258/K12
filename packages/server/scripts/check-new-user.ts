import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkNewUser() {
  // 查找梁哈哈
  const user = await prisma.user.findFirst({
    where: { name: '梁哈哈' },
    include: {
      student: {
        include: {
          grade: true,
          class: true,
        },
      },
      roleRef: true,
    },
  });

  console.log('梁哈哈用户信息:');
  console.log(JSON.stringify(user, null, 2));

  // 检查所有角色
  const roles = await prisma.role.findMany();
  console.log('\n所有角色:');
  roles.forEach((r) => {
    console.log(`  - ${r.name} (${r.code}) [id: ${r.id}]`);
  });
}

checkNewUser()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
