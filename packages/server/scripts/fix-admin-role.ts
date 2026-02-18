import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixAdminRole() {
  console.log('开始修复管理员角色...');
  
  // 1. 查找现有的 admin 角色
  const existingAdmin = await prisma.role.findUnique({
    where: { code: 'admin' },
  });

  if (existingAdmin) {
    console.log(`找到现有角色: ${existingAdmin.name} (code: ${existingAdmin.code}, isSystem: ${existingAdmin.isSystem})`);
    
    // 2. 查找是否有用户使用这个角色
    const usersWithRole = await prisma.user.findMany({
      where: { roleId: existingAdmin.id },
    });
    
    console.log(`有 ${usersWithRole.length} 个用户使用此角色`);
    
    // 3. 先创建新的 ADMIN 角色（如果不存在）
    const newAdminRole = await prisma.role.upsert({
      where: { code: 'ADMIN' },
      update: {},
      create: {
        name: '超级管理员',
        code: 'ADMIN',
        description: '系统最高权限，可管理所有功能',
        permissions: ['*'],
        isSystem: true,
      },
    });
    
    console.log(`✅ 确保 ADMIN 角色存在: ${newAdminRole.name} (${newAdminRole.code})`);
    
    // 4. 将所有使用旧角色的用户迁移到新角色
    if (usersWithRole.length > 0) {
      for (const user of usersWithRole) {
        await prisma.user.update({
          where: { id: user.id },
          data: { roleId: newAdminRole.id },
        });
        console.log(`  - 迁移用户: ${user.name} (${user.account})`);
      }
      console.log(`✅ 已迁移 ${usersWithRole.length} 个用户到新角色`);
    }
    
    // 5. 删除旧的 admin 角色
    await prisma.role.delete({
      where: { id: existingAdmin.id },
    });
    
    console.log(`✅ 已删除旧角色: ${existingAdmin.name} (code: admin)`);
  } else {
    console.log('未找到 code 为 admin 的角色');
    
    // 直接创建 ADMIN 角色
    const newAdminRole = await prisma.role.create({
      data: {
        name: '超级管理员',
        code: 'ADMIN',
        description: '系统最高权限，可管理所有功能',
        permissions: ['*'],
        isSystem: true,
      },
    });
    
    console.log(`✅ 创建 ADMIN 角色: ${newAdminRole.name} (${newAdminRole.code})`);
  }
  
  // 6. 确保所有系统角色的 isSystem 标志正确
  const systemRoleCodes = ['ADMIN', 'SCHOOL_ADMIN', 'GRADE_ADMIN', 'CLASS_TEACHER', 'SUBJECT_TEACHER', 'STUDENT'];
  
  for (const code of systemRoleCodes) {
    const role = await prisma.role.findUnique({
      where: { code },
    });
    
    if (role && !role.isSystem) {
      await prisma.role.update({
        where: { id: role.id },
        data: { isSystem: true },
      });
      console.log(`✅ 更新 ${role.name} 为系统内置角色`);
    }
  }
  
  console.log('🎉 管理员角色修复完成！');
  
  // 7. 显示所有角色
  const allRoles = await prisma.role.findMany({
    orderBy: { createdAt: 'asc' },
  });
  
  console.log('\n当前所有角色:');
  allRoles.forEach((role) => {
    console.log(`  - ${role.name} (${role.code}) [${role.isSystem ? '内置' : '自定义'}]`);
  });
}

fixAdminRole()
  .catch((e) => {
    console.error('修复失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
