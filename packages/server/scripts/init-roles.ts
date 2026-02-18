import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SYSTEM_ROLES = [
  {
    code: 'ADMIN',
    name: '超级管理员',
    description: '系统最高权限，可管理所有功能',
    permissions: ['*'],
  },
  {
    code: 'SCHOOL_ADMIN',
    name: '学校管理员',
    description: '学校全部管理权限',
    permissions: ['*'],
  },
  {
    code: 'GRADE_ADMIN',
    name: '年级主任',
    description: '年级管理权限，可查看和管理本年级数据',
    permissions: [
      'dashboard:view',
      'grades:view',
      'classes:view',
      'classes:create',
      'classes:edit',
      'students:view',
      'students:create',
      'students:edit',
      'teachers:view',
      'dorms:view',
      'dorms:create',
      'dorms:edit',
      'exams:view',
      'exams:create',
      'exams:edit',
      'moral:view',
      'moral:create',
      'moral:edit',
    ],
  },
  {
    code: 'CLASS_TEACHER',
    name: '班主任',
    description: '班级管理权限，可查看和管理本班学生',
    permissions: [
      'dashboard:view',
      'classes:view',
      'students:view',
      'students:create',
      'students:edit',
      'dorms:view',
      'exams:view',
      'moral:view',
      'moral:create',
      'moral:edit',
    ],
  },
  {
    code: 'SUBJECT_TEACHER',
    name: '科任老师',
    description: '学科教学权限，可查看和录入成绩',
    permissions: [
      'dashboard:view',
      'classes:view',
      'students:view',
      'exams:view',
      'exams:create',
      'exams:edit',
    ],
  },
  {
    code: 'STUDENT',
    name: '学生',
    description: '学生本人查看权限',
    permissions: [
      'dashboard:view',
    ],
  },
];

async function initSystemRoles() {
  console.log('开始初始化系统内置角色...');
  
  for (const role of SYSTEM_ROLES) {
    const existing = await prisma.role.findUnique({
      where: { code: role.code },
    });

    if (!existing) {
      await prisma.role.create({
        data: {
          name: role.name,
          code: role.code,
          description: role.description,
          permissions: role.permissions,
          isSystem: true,
        },
      });
      console.log(`✅ 创建角色: ${role.name} (${role.code})`);
    } else {
      console.log(`⏭️ 角色已存在: ${role.name} (${role.code})`);
    }
  }
  
  console.log('🎉 系统角色初始化完成！');
}

initSystemRoles()
  .catch((e) => {
    console.error('初始化失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
