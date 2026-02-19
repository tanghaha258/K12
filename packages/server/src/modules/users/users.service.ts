import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    const user = await this.prisma.users.findUnique({
      where: { id },
      include: {
        students: {
          include: {
            grades: true,
            classes: true,
          },
        },
        teachers: {
          include: {
            teacher_classes: {
              include: {
                classes: true,
                subjects: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return null;
    }

    const { password, ...result } = user;
    return result;
  }

  async findByAccount(account: string) {
    return this.prisma.users.findUnique({
      where: { account },
    });
  }

  async findAll(filters: { role?: string; status?: string; search?: string }, page: number = 1, pageSize: number = 10) {
    const where: any = {};

    if (filters.role) {
      where.role = filters.role;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search } },
        { account: { contains: filters.search } },
      ];
    }

    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const [users, total] = await Promise.all([
      this.prisma.users.findMany({
        where,
        include: {
          students: {
            include: {
              grades: true,
              classes: true,
            },
          },
          teachers: true,
          roles: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.users.count({ where }),
    ]);

    return {
      users: users.map((user) => {
        const { password, ...result } = user;
        return {
          ...result,
          roleName: user.roles?.name || user.role,
          roleCode: user.roles?.code || user.role,
          // 转换字段名为前端期望的格式
          student: user.students ? {
            studentNo: user.students.studentNo,
            gradeId: user.students.gradeId,
            classId: user.students.classId,
            grade: user.students.grades,
            class: user.students.classes,
          } : undefined,
          teacher: user.teachers ? {
            teacherNo: user.teachers.teacherNo,
          } : undefined,
        };
      }),
      total,
    };
  }

  async batchImport(
    type: 'STUDENT' | 'TEACHER',
    users: any[],
    operatorId: string,
  ) {
    const results = {
      success: 0,
      failed: 0,
      errors: [] as { row: number; message: string }[],
    };

    const defaultPassword = await bcrypt.hash('123456', 10);

    for (let i = 0; i < users.length; i++) {
      const userData = users[i];
      try {
        if (type === 'STUDENT') {
          const existing = await this.prisma.students.findUnique({
            where: { studentNo: userData.studentNo },
          });
          if (existing) {
            throw new BadRequestException(`学号 ${userData.studentNo} 已存在`);
          }

          await this.prisma.users.create({
            data: {
              id: uuidv4(),
              account: userData.studentNo,
              password: defaultPassword,
              name: userData.name,
              role: 'STUDENT',
              status: 'ACTIVE',
              updatedAt: new Date(),
              students: {
                create: {
                  id: uuidv4(),
                  studentNo: userData.studentNo,
                  gender: userData.gender || 'male',
                  entryYear: userData.entryYear || new Date().getFullYear(),
                  gradeId: userData.gradeId,
                  classId: userData.classId,
                  updatedAt: new Date(),
                },
              },
            },
          });
        } else if (type === 'TEACHER') {
          const existing = await this.prisma.teachers.findUnique({
            where: { teacherNo: userData.teacherNo },
          });
          if (existing) {
            throw new BadRequestException(`工号 ${userData.teacherNo} 已存在`);
          }

          await this.prisma.users.create({
            data: {
              id: uuidv4(),
              account: userData.teacherNo,
              password: defaultPassword,
              name: userData.name,
              role: userData.role || 'SUBJECT_TEACHER',
              status: 'ACTIVE',
              updatedAt: new Date(),
              teachers: {
                create: {
                  id: uuidv4(),
                  teacherNo: userData.teacherNo,
                  name: userData.name,
                  updatedAt: new Date(),
                },
              },
            },
          });
        }

        results.success++;
      } catch (error: any) {
        results.failed++;
        results.errors.push({
          row: i + 2,
          message: error.message || '导入失败',
        });
      }
    }

    return results;
  }

  async batchResetPassword(userIds: string[], operatorId: string) {
    const defaultPassword = await bcrypt.hash('123456', 10);

    await this.prisma.users.updateMany({
      where: { id: { in: userIds } },
      data: { password: defaultPassword },
    });

    return {
      success: true,
      count: userIds.length,
      defaultPassword: '123456',
    };
  }

  async updateStatus(userId: string, status: string, operatorId: string) {
    const user = await this.prisma.users.update({
      where: { id: userId },
      data: { status: status as any },
    });

    const { password, ...result } = user;
    return result;
  }

  async assignRole(userId: string, roleId: string, operatorId: string) {
    const role = await this.prisma.roles.findUnique({
      where: { id: roleId },
    });
    if (!role) {
      throw new BadRequestException('角色不存在');
    }

    const updatedUser = await this.prisma.users.update({
      where: { id: userId },
      data: {
        roleId,
        role: role.code as any,
      },
    });

    const { password, ...result } = updatedUser;
    return result;
  }

  async findDetailById(id: string) {
    const user = await this.prisma.users.findUnique({
      where: { id },
      include: {
        roles: true,
        students: {
          include: {
            grades: true,
            classes: true,
          },
        },
        teachers: {
          include: {
            teacher_classes: {
              include: {
                classes: {
                  include: {
                    grades: true,
                  },
                },
                subjects: true,
              },
            },
          },
        },
        data_scopes: true,
      },
    });

    if (!user) {
      return null;
    }

    const dataScopesWithDetails = await Promise.all(
      user.data_scopes.map(async (scope) => {
        let detail: any = { ...scope };
        
        if (scope.scopeType === 'GRADE') {
          const grade = await this.prisma.grades.findUnique({
            where: { id: scope.scopeId },
          });
          detail.grade = grade;
        } else if (scope.scopeType === 'CLASS') {
          const classData = await this.prisma.classes.findUnique({
            where: { id: scope.scopeId },
            include: { grades: true },
          });
          detail.class = classData;
        } else if (scope.scopeType === 'SUBJECT') {
          const subject = await this.prisma.subjects.findUnique({
            where: { id: scope.scopeId },
          });
          detail.subject = subject;
        }
        
        return detail;
      })
    );

    const { password, data_scopes, students, teachers, ...result } = user;
    return {
      ...result,
      // 转换字段名为前端期望的格式
      student: students ? {
        studentNo: students.studentNo,
        grade: students.grades,
        class: students.classes,
      } : undefined,
      teacher: teachers ? {
        teacherNo: teachers.teacherNo,
        teacherClasses: teachers.teacher_classes?.map(tc => ({
          class: {
            id: tc.classes?.id,
            name: tc.classes?.name,
            grade: tc.classes?.grades,
          },
          subject: tc.subjects,
        })),
      } : undefined,
      dataScopes: dataScopesWithDetails,
      roleName: user.roles?.name || user.role,
      roleCode: user.roles?.code || user.role,
    };
  }
}
