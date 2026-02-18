import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createAdminRole() {
  console.log('创建超级管理员角色...');
  
  // 检查 ADMIN 角色是否已存在
  const existingAdmin = await prisma.role.findUnique({
    where: { code: 'ADMIN' },
  });

  if (existingAdmin) {
    console.log(`ADMIN 角色已存在: ${existingAdmin.name}`);
    
    // 确保 isSystem 为 true
    if (!existingAdmin.isSystem) {
      await prisma.role.update({
        where: { id: existingAdmin.id },
        data: { isSystem: true },
      });
      console.log('✅ 已更新为系统内置角色');
    }
  } else {
    // 创建新的 ADMIN 角色
    const adminRole = await prisma.role.create({
      data: {
        name: '超级管理员',
        code: 'ADMIN',
        description: '系统最高权限，可管理所有功能',
        permissions: ['*'],
        isSystem: true,
      },
    });
    
    console.log(`✅ 创建成功: ${adminRole.name} (${adminRole.code})`);
  }
  
  // 显示所有角色
  const allRoles = await prisma.role.findMany({
    orderBy: { createdAt: 'asc' },
  });
  
  console.log('\n当前所有角色:');
  allRoles.forEach((role) => {
    console.log(`  - ${role.name} (${role.code}) [${role.isSystem ? '内置' : '自定义'}]`);
  });
}

createAdminRole()
  .catch((e) => {
    console.error('创建失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
