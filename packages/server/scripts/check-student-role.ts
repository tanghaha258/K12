import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('检查 STUDENT 角色...');
  
  const studentRole = await prisma.roles.findUnique({
    where: { code: 'STUDENT' },
  });
  
  if (!studentRole) {
    console.log('STUDENT 角色不存在，需要创建...');
    
    const newRole = await prisma.roles.create({
      data: {
        id: 'role-student',
        name: '学生',
        code: 'STUDENT',
        description: '学生角色',
        permissions: ['students:view_own', 'scores:view_own'],
        isSystem: true,
        updatedAt: new Date(),
      },
    });
    
    console.log('已创建 STUDENT 角色:', newRole);
    
    // 更新所有学生的 roleId
    const students = await prisma.users.findMany({
      where: { role: 'STUDENT' },
    });
    
    for (const user of students) {
      await prisma.users.update({
        where: { id: user.id },
        data: { roleId: newRole.id },
      });
      console.log(`更新用户 ${user.name} 的 roleId`);
    }
    
    console.log('\n所有学生用户的 roleId 已更新');
  } else {
    console.log('STUDENT 角色已存在:', studentRole);
    
    // 更新所有没有 roleId 的学生用户
    const students = await prisma.users.findMany({
      where: { 
        role: 'STUDENT',
        roleId: null,
      },
    });
    
    for (const user of students) {
      await prisma.users.update({
        where: { id: user.id },
        data: { roleId: studentRole.id },
      });
      console.log(`更新用户 ${user.name} 的 roleId`);
    }
    
    console.log('\n所有学生用户的 roleId 已更新');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
