import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const roleCodeMap: Record<string, string> = {
  'ADMIN': '超级管理员',
  'SCHOOL_ADMIN': '学校管理员',
  'GRADE_ADMIN': '年级主任',
  'CLASS_TEACHER': '班主任',
  'SUBJECT_TEACHER': '科任老师',
  'STUDENT': '学生',
};

async function fixAllUsersRoleId() {
  console.log('开始修复所有用户的 roleId...\n');
  
  // 获取所有角色
  const roles = await prisma.role.findMany();
  const roleMap = new Map(roles.map(r => [r.code, r.id]));
  
  // 查找所有 roleId 为 null 的用户
  const usersWithoutRoleId = await prisma.user.findMany({
    where: {
      roleId: null,
    },
  });

  console.log(`找到 ${usersWithoutRoleId.length} 个需要修复的用户\n`);

  for (const user of usersWithoutRoleId) {
    const roleId = roleMap.get(user.role);
    if (roleId) {
      await prisma.user.update({
        where: { id: user.id },
        data: { roleId },
      });
      console.log(`✅ 修复用户: ${user.name} (${user.account}) -> ${roleCodeMap[user.role] || user.role}`);
    } else {
      console.log(`❌ 未找到角色: ${user.role} (用户: ${user.name})`);
    }
  }

  console.log('\n修复完成！');
}

fixAllUsersRoleId()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
