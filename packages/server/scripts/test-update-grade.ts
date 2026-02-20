import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const grade = await prisma.grades.findFirst();
  if (!grade) {
    console.log('没有找到年级');
    return;
  }
  
  console.log('尝试更新年级:', grade.id);
  
  try {
    const updated = await prisma.grades.update({
      where: { id: grade.id },
      data: {
        name: grade.name + '_test',
        updatedAt: new Date(),
      },
    });
    console.log('更新成功:', updated);
    
    // 恢复
    await prisma.grades.update({
      where: { id: grade.id },
      data: {
        name: grade.name,
        updatedAt: new Date(),
      },
    });
    console.log('已恢复');
  } catch (e) {
    console.error('更新失败:', e);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
