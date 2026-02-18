import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixUserRoleId() {
  // 查找 STUDENT 角色的 ID
  const studentRole = await prisma.role.findUnique({
    where: { code: 'STUDENT' },
  });

  if (!studentRole) {
    console.log('STUDENT 角色不存在');
    return;
  }

  console.log(`STUDENT 角色 ID: ${studentRole.id}`);

  // 查找所有 roleId 为 null 且 role 为 STUDENT 的用户
  const usersWithoutRoleId = await prisma.user.findMany({
    where: {
      role: 'STUDENT',
      roleId: null,
    },
  });

  console.log(`\n找到 ${usersWithoutRoleId.length} 个需要修复的用户`);

  for (const user of usersWithoutRoleId) {
    await prisma.user.update({
      where: { id: user.id },
      data: { roleId: studentRole.id },
    });
    console.log(`✅ 修复用户: ${user.name} (${user.account})`);
  }

  console.log('\n修复完成！');
}

fixUserRoleId()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
