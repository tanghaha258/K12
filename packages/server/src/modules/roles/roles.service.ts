import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';

const SYSTEM_ROLES = [
  {
    name: '系统管理员',
    code: 'ADMIN',
    description: '系统超级管理员，拥有所有权限',
    permissions: ['*'],
  },
  {
    name: '学校管理员',
    code: 'SCHOOL_ADMIN',
    description: '学校管理员，管理学校基础数据',
    permissions: ['users:read', 'users:write', 'grades:read', 'grades:write'],
  },
  {
    name: '年级组长',
    code: 'GRADE_ADMIN',
    description: '年级组长，管理年级数据',
    permissions: ['grades:read', 'classes:read', 'students:read'],
  },
  {
    name: '班主任',
    code: 'CLASS_TEACHER',
    description: '班主任，管理班级学生',
    permissions: ['classes:read', 'students:read', 'students:write'],
  },
  {
    name: '任课教师',
    code: 'SUBJECT_TEACHER',
    description: '任课教师，查看学生成绩',
    permissions: ['students:read', 'scores:read'],
  },
];

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  async initSystemRoles() {
    for (const role of SYSTEM_ROLES) {
      const existing = await this.prisma.roles.findUnique({
        where: { code: role.code },
      });

      if (!existing) {
        await this.prisma.roles.create({
          data: {
            id: uuidv4(),
            name: role.name,
            code: role.code,
            description: role.description,
            permissions: role.permissions,
            isSystem: true,
            updatedAt: new Date(),
          },
        });
      }
    }
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
      throw new NotFoundException('角色不存在');
    }
    return role;
  }

  async create(data: {
    name: string;
    code: string;
    description?: string;
    permissions?: string[];
  }) {
    const existing = await this.prisma.roles.findUnique({
      where: { code: data.code },
    });
    if (existing) {
      throw new BadRequestException('角色编码已存在');
    }

    return this.prisma.roles.create({
      data: {
        id: uuidv4(),
        name: data.name,
        code: data.code,
        description: data.description,
        permissions: data.permissions || [],
        updatedAt: new Date(),
      },
    });
  }

  async update(
    id: string,
    data: {
      name?: string;
      description?: string;
      permissions?: string[];
    },
  ) {
    await this.findById(id);

    return this.prisma.roles.update({
      where: { id },
      data: data as any,
    });
  }

  async delete(id: string) {
    const role = await this.findById(id);

    if (role.isSystem) {
      throw new BadRequestException('系统内置角色无法删除');
    }

    const usersWithRole = await this.prisma.users.count({
      where: { roleId: id },
    });
    if (usersWithRole > 0) {
      throw new BadRequestException('该角色下存在用户，无法删除');
    }

    return this.prisma.roles.delete({
      where: { id },
    });
  }

  async copy(id: string, data: { name: string; code: string }) {
    const role = await this.findById(id);

    const existing = await this.prisma.roles.findUnique({
      where: { code: data.code },
    });
    if (existing) {
      throw new BadRequestException('角色编码已存在');
    }

    return this.prisma.roles.create({
      data: {
        id: uuidv4(),
        name: data.name,
        code: data.code,
        description: role.description,
        permissions: role.permissions as any,
        isSystem: false,
        updatedAt: new Date(),
      },
    });
  }

  async getPermissions(id: string) {
    const role = await this.findById(id);
    return {
      roleId: id,
      permissions: role.permissions as string[],
    };
  }

  async setPermissions(id: string, permissions: string[]) {
    await this.findById(id);

    return this.prisma.roles.update({
      where: { id },
      data: {
        permissions: permissions as any,
        updatedAt: new Date(),
      },
    });
  }

  async getMenus() {
    return [
      {
        id: 'dashboard',
        name: '工作台',
        permissions: ['view'],
      },
      {
        id: 'grades',
        name: '年级管理',
        permissions: ['view', 'create', 'edit', 'delete', 'import', 'export'],
      },
      {
        id: 'classes',
        name: '班级管理',
        permissions: ['view', 'create', 'edit', 'delete', 'import', 'export'],
      },
      {
        id: 'students',
        name: '学生管理',
        permissions: ['view', 'create', 'edit', 'delete', 'import', 'export'],
      },
      {
        id: 'teachers',
        name: '教师管理',
        permissions: ['view', 'create', 'edit', 'delete', 'import', 'export'],
      },
      {
        id: 'dorms',
        name: '宿舍管理',
        permissions: ['view', 'create', 'edit', 'delete', 'import', 'export'],
      },
      {
        id: 'users',
        name: '用户管理',
        permissions: ['view', 'create', 'edit', 'delete', 'import', 'reset-password'],
      },
      {
        id: 'datascopes',
        name: '数据范围',
        permissions: ['view', 'edit'],
      },
      {
        id: 'exams',
        name: '考试管理',
        permissions: ['view', 'create', 'edit', 'delete'],
      },
      {
        id: 'moral',
        name: '德育管理',
        permissions: ['view', 'create', 'edit', 'delete'],
      },
      {
        id: 'settings',
        name: '系统设置',
        permissions: ['view', 'edit'],
      },
    ];
  }
}
