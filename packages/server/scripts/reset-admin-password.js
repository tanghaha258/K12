const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('123456', 10);
  const result = await prisma.user.update({
    where: { account: 'admin' },
    data: { password: hashedPassword }
  });
  console.log('Admin password reset successfully');
  console.log('Account: admin');
  console.log('Password: 123456');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
