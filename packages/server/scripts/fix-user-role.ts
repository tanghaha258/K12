import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixUserRoleData() {
  console.log('修复用户角色数据不一致问题...\n');
  
  const users = await prisma.user.findMany();
  
  for (const user of users) {
    if (user.roleId) {
      // 如果有 roleId，根据关联角色更新 role 字段
      const role = await prisma.role.findUnique({
        where: { id: user.roleId },
      });
      
      if (role && user.role !== role.code) {
        console.log(`修复用户 ${user.name}:`);
        console.log(`  当前 role: ${user.role}`);
        console.log(`  当前 roleId 关联: ${role.name} (${role.code})`);
        
        await prisma.user.update({
          where: { id: user.id },
          data: { role: role.code as any },
        });
        
        console.log(`  ✅ 已更新 role 为: ${role.code}`);
        console.log('');
      }
    } else {
      // 如果没有 roleId，根据 role 字段查找对应的角色
      const role = await prisma.role.findUnique({
        where: { code: user.role },
      });
      
      if (role) {
        console.log(`修复用户 ${user.name}:`);
        console.log(`  当前 role: ${user.role}`);
        console.log(`  当前 roleId: null`);
        
        await prisma.user.update({
          where: { id: user.id },
          data: { roleId: role.id },
        });
        
        console.log(`  ✅ 已更新 roleId 为: ${role.id} (${role.name})`);
        console.log('');
      }
    }
  }
  
  // 再次检查所有用户
  console.log('\n修复后的用户数据:');
  const fixedUsers = await prisma.user.findMany();
  
  for (const user of fixedUsers) {
    const role = user.roleId ? await prisma.role.findUnique({ where: { id: user.roleId } }) : null;
    console.log(`  ${user.name} (${user.account})`);
    console.log(`    role: ${user.role}`);
    console.log(`    roleId: ${user.roleId}`);
    console.log(`    关联角色: ${role?.name || '无'} (${role?.code || '无'})`);
    console.log(`    状态: ${user.role === role?.code ? '✅ 一致' : '❌ 不一致'}`);
    console.log('');
  }
}

fixUserRoleData()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
