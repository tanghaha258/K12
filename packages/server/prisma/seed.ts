import { PrismaClient, UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('开始初始化数据...');

  const existingAdmin = await prisma.user.findUnique({
    where: { account: 'admin' },
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await prisma.user.create({
      data: {
        account: 'admin',
        password: hashedPassword,
        name: '系统管理员',
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
      },
    });
    console.log('✅ 默认管理员账号已创建: admin / admin123');
  } else {
    console.log('⚠️ 管理员账号已存在，跳过创建');
  }

  const subjects = ['语文', '数学', '英语', '物理', '化学', '生物', '政治', '历史', '地理'];
  for (const name of subjects) {
    const existing = await prisma.subject.findFirst({ where: { name } });
    if (!existing) {
      await prisma.subject.create({
        data: {
          name,
          code: name.toUpperCase(),
        },
      });
    }
  }
  console.log('✅ 科目数据初始化完成');

  console.log('🎉 数据初始化完成！');
}

main()
  .catch((e) => {
    console.error('初始化失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
