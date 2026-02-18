import { Injectable, NotFoundException, BadRequestException, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

// 系统预定义菜�?const SYSTEM_MENUS = [
  {
    id: 'dashboard',
    name: '工作�?,
    path: '/',
    icon: 'LayoutDashboard',
    permissions: ['view'],
  },
  {
    id: 'grades',
    name: '年级管理',
    path: '/grades',
    icon: 'GraduationCap',
    permissions: ['view', 'create', 'edit', 'delete', 'import', 'export'],
  },
  {
    id: 'classes',
    name: '班级管理',
    path: '/classes',
    icon: 'School',
    permissions: ['view', 'create', 'edit', 'delete', 'import', 'export'],
  },
  {
    id: 'students',
    name: '学生管理',
    path: '/students',
    icon: 'Users',
    permissions: ['view', 'create', 'edit', 'delete', 'import', 'export'],
  },
  {
    id: 'teachers',
    name: '教师管理',
    path: '/teachers',
    icon: 'UserCog',
    permissions: ['view', 'create', 'edit', 'delete', 'import', 'export'],
  },
  {
    id: 'dorms',
    name: '宿舍管理',
    path: '/dorms',
    icon: 'Building2',
    permissions: ['view', 'create', 'edit', 'delete', 'import', 'export'],
  },
  {
    id: 'users',
    name: '用户管理',
    path: '/users',
    icon: 'Users',
    permissions: ['view', 'create', 'edit', 'delete', 'import', 'reset-password'],
  },
  {
    id: 'datascopes',
    name: '数据权限',
    path: '/datascopes',
    icon: 'Shield',
    permissions: ['view', 'edit'],
  },
  {
    id: 'exams',
    name: '考务中心',
    path: '/exams',
    icon: 'BookOpen',
    permissions: ['view', 'create', 'edit', 'delete'],
  },
  {
    id: 'moral',
    name: '德育量化',
    path: '/moral',
    icon: 'ClipboardList',
    permissions: ['view', 'create', 'edit', 'delete'],
  },
  {
    id: 'settings',
    name: '系统设置',
    path: '/settings',
    icon: 'Settings',
    permissions: ['view', 'edit'],
  },
];

// 系统内置角色定义
const SYSTEM_ROLES = [
  {
    code: 'ADMIN',
    name: '超级管理�?,
    description: '系统最高权限，可管理所有功�?,
    permissions: ['*'],
  },
  {
    code: 'SCHOOL_ADMIN',
    name: '学校管理�?,
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
    name: '班主�?,
    description: '班级管理权限，可查看和管理本班学�?,
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
    description: '学科教学权限，可查看和录入成�?,
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

@Injectable()
export class RolesService implements OnModuleInit {
  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    await this.initSystemRoles();
  }

  // 初始化系统内置角�?  async initSystemRoles() {
    for (const role of SYSTEM_ROLES) {
      const existing = await this.prisma.roles.findUnique({
        where: { code: role.code },
      });

      if (!existing) {
        await this.prisma.roles.create({
          data: {
            name: role.name,
            code: role.code,
            description: role.description,
            permissions: role.permissions,
            isSystem: true,
          },
        });
        console.log(`�?Created system role: ${role.name}`);
      }
    }
    console.log('🎉 System roles initialization completed');
  }

  async findAll() {
    return this.prisma.roles.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    const role = await this.prisma.roles.findUnique({
      where: { id },
    });
    if (!role) {
      throw new NotFoundException('角色不存�?);
    }
    return role;
  }

  async create(data: {
    name: string;
    code: string;
    description?: string;
    permissions?: string[];
  }) {
    // 检�?code 是否已存�?    const existing = await this.prisma.roles.findUnique({
      where: { code: data.code },
    });
    if (existing) {
      throw new BadRequestException('角色编码已存�?);
    }

    return this.prisma.roles.create({
      data: {
        name: data.name,
        code: data.code,
        description: data.description,
        permissions: data.permissions || [],
      },
    }) as any;
  }

  async copy(id: string, data: { name: string; code: string }) {
    const sourceRole = await this.findById(id);

    // 检�?code 是否已存�?    const existing = await this.prisma.roles.findUnique({
      where: { code: data.code },
    });
    if (existing) {
      throw new BadRequestException('角色编码已存�?);
    }

    return this.prisma.roles.create({
      data: {
        name: data.name,
        code: data.code,
        description: `${sourceRole.description || ''} (复制)`,
        permissions: sourceRole.permissions as any,
      },
    }) as any;
  }

  async update(
    id: string,
    data: {
      name?: string;
      description?: string;
      permissions?: string[];
    },
  ) {
    const role = await this.findById(id);

    return this.prisma.roles.update({
      where: { id },
      data: data as any,
    }) as any;
  }

  async delete(id: string) {
    const role = await this.findById(id);

    // 检查是否为系统内置角色
    if (role.isSystem) {
      throw new BadRequestException('系统内置角色无法删除');
    }

    // 检查是否有用户使用该角�?    const usersWithRole = await this.prisma.users.count({
      where: { roleId: id },
    });
    if (usersWithRole > 0) {
      throw new BadRequestException('该角色下存在用户，无法删�?);
    }

    return this.prisma.roles.delete({
      where: { id },
    });
  }

  async getPermissions(id: string) {
    const role = await this.findById(id);
    return {
      roleId: id,
      permissions: role.permissions,
    };
  }

  async setPermissions(id: string, permissions: string[]) {
    await this.findById(id);

    return this.prisma.roles.update({
      where: { id },
      data: { permissions: permissions as any },
    }) as any;
  }

  async getMenus() {
    return SYSTEM_MENUS;
  }
}
