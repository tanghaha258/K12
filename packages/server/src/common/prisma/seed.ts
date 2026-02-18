import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // 检查是否已有管理员
  const existingAdmin = await prisma.users.findFirst({
    where: { role: 'ADMIN' },
  });

  if (existingAdmin) {
    console.log('管理员账号已存在，跳过初始化');
    return;
  }

  // 创建默认管理员账号
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const admin = await prisma.users.create({
    data: {
      account: 'admin',
      password: hashedPassword,
      name: '系统管理员',
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });

  console.log('默认管理员账号创建成功');
  console.log('账号: admin');
  console.log('密码: admin123');
  console.log('请登录后立即修改密码');
}

main()
  .catch((e) => {
    console.error('初始化失败', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
