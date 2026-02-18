import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUsers() {
  console.log('检查用户角色信息...\n');
  
  const users = await prisma.user.findMany({
    include: {
      role: true,
      student: true,
      teacher: true,
    },
  });
  
  console.log('所有用户:');
  users.forEach((user) => {
    console.log(`  - ${user.name} (${user.account})`);
    console.log(`    role字段: ${user.role}`);
    console.log(`    roleId: ${user.roleId}`);
    console.log(`    关联角色: ${user.role?.name || '无'} (${user.role?.code || '无'})`);
    console.log('');
  });
  
  // 检查所有角色
  const roles = await prisma.role.findMany();
  console.log('\n所有角色:');
  roles.forEach((role) => {
    console.log(`  - ${role.name} (${role.code}) [id: ${role.id}]`);
  });
}

checkUsers()
  .catch((e) => {
    console.error('检查失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
