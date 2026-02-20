import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('检查角色数据...');
  const roles = await prisma.roles.findMany();
  
  for (const role of roles) {
    console.log(`\n角色: ${role.name} (${role.code})`);
    console.log(`  permissions 类型: ${typeof role.permissions}`);
    console.log(`  permissions 值:`, role.permissions);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
