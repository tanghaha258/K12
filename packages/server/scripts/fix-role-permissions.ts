import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 定义各角色的权限
const rolePermissions: Record<string, string[]> = {
  ADMIN: ['*'], // 所有权限
  CLASS_TEACHER: [
    'students:view', 'students:edit',
    'scores:view', 'scores:edit',
    'analysis:view',
    'moral:view', 'moral:edit',
  ],
  GRADE_ADMIN: [
    'students:view', 'students:edit', 'students:import',
    'classes:view', 'classes:edit',
    'scores:view', 'scores:edit', 'scores:import',
    'analysis:view',
    'moral:view', 'moral:edit',
  ],
  SCHOOL_ADMIN: [
    'students:view', 'students:edit', 'students:import', 'students:delete',
    'teachers:view', 'teachers:edit', 'teachers:delete',
    'classes:view', 'classes:edit', 'classes:delete',
    'grades:view', 'grades:edit',
    'scores:view', 'scores:edit', 'scores:import',
    'analysis:view',
    'moral:view', 'moral:edit',
    'dorms:view', 'dorms:edit',
  ],
  SUBJECT_TEACHER: [
    'students:view',
    'scores:view', 'scores:edit',
    'analysis:view',
  ],
};

async function main() {
  console.log('修复角色权限数据...');

  for (const [code, permissions] of Object.entries(rolePermissions)) {
    const role = await prisma.roles.findUnique({
      where: { code },
    });

    if (role) {
      await prisma.roles.update({
        where: { id: role.id },
        data: {
          permissions: permissions,
          updatedAt: new Date(),
        },
      });
      console.log(`更新角色 ${role.name} (${code}) 的权限:`, permissions);
    }
  }

  console.log('\n权限修复完成！');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
