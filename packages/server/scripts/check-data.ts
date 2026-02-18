import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkData() {
  // 检查所有用户
  const users = await prisma.user.findMany();
  
  console.log('用户数据:');
  for (const user of users) {
    console.log(`  ${user.name} (${user.account})`);
    console.log(`    role字段: ${user.role}`);
    console.log(`    roleId: ${user.roleId}`);
    
    if (user.roleId) {
      const role = await prisma.role.findUnique({
        where: { id: user.roleId },
      });
      console.log(`    关联角色: ${role?.name} (${role?.code})`);
    }
    console.log('');
  }
  
  // 检查所有角色
  const roles = await prisma.role.findMany();
  console.log('\n角色数据:');
  for (const role of roles) {
    console.log(`  ${role.name} (${role.code}) - id: ${role.id}`);
  }
}

checkData()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
