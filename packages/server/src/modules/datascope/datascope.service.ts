import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class DataScopeService {
  constructor(public prisma: PrismaService) {}

  async getUserDataScopes(userId: string) {
    const scopes = await this.prisma.data_scopes.findMany({
      where: { userId },
      orderBy: { scopeType: 'asc' },
    });

    const grouped = {
      grades: scopes.filter((s) => s.scopeType === 'GRADE'),
      classes: scopes.filter((s) => s.scopeType === 'CLASS'),
      subjects: scopes.filter((s) => s.scopeType === 'SUBJECT'),
    };

    return {
      userId,
      scopes,
      grouped,
    };
  }

  async setUserDataScopes(
    userId: string,
    scopes: { scopeType: string; scopeId: string }[],
  ) {
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    await this.prisma.data_scopes.deleteMany({
      where: { userId },
    });

    if (scopes.length > 0) {
      await this.prisma.data_scopes.createMany({
        data: scopes.map((s) => ({
          id: uuidv4(),
          userId,
          scopeType: s.scopeType,
          scopeId: s.scopeId,
          updatedAt: new Date(),
        })),
      });
    }

    return {
      success: true,
      count: scopes.length,
    };
  }

  async deleteDataScope(id: string) {
    const scope = await this.prisma.data_scopes.findUnique({
      where: { id },
    });
    if (!scope) {
      throw new NotFoundException('数据范围不存在');
    }

    await this.prisma.data_scopes.delete({
      where: { id },
    });

    return { success: true };
  }

  async checkDataScope(
    userId: string,
    scopeType: string,
    scopeId: string,
  ): Promise<boolean> {
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
    });
    if (user?.role === 'ADMIN' || user?.role === 'SCHOOL_ADMIN') {
      return true;
    }

    const scope = await this.prisma.data_scopes.findFirst({
      where: {
        userId,
        scopeType,
        scopeId,
      },
    });

    return !!scope;
  }

  async getUserGradeIds(userId: string): Promise<string[]> {
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
    });
    if (user?.role === 'ADMIN' || user?.role === 'SCHOOL_ADMIN') {
      const grades = await this.prisma.grades.findMany({
        where: { status: 'active' },
      });
      return grades.map((g) => g.id);
    }

    const scopes = await this.prisma.data_scopes.findMany({
      where: {
        userId,
        scopeType: 'GRADE',
      },
    });
    return scopes.map((s) => s.scopeId);
  }

  async getUserClassIds(userId: string): Promise<string[]> {
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
    });
    if (user?.role === 'ADMIN' || user?.role === 'SCHOOL_ADMIN') {
      const classes = await this.prisma.classes.findMany();
      return classes.map((c) => c.id);
    }

    const scopes = await this.prisma.data_scopes.findMany({
      where: {
        userId,
        scopeType: { in: ['CLASS', 'GRADE'] },
      },
    });

    const classIds: string[] = [];
    const gradeIds: string[] = [];

    for (const scope of scopes) {
      if (scope.scopeType === 'CLASS') {
        classIds.push(scope.scopeId);
      } else if (scope.scopeType === 'GRADE') {
        gradeIds.push(scope.scopeId);
      }
    }

    if (gradeIds.length > 0) {
      const gradeClasses = await this.prisma.classes.findMany({
        where: {
          gradeId: { in: gradeIds },
        },
      });
      gradeClasses.forEach((c) => classIds.push(c.id));
    }

    return [...new Set(classIds)];
  }
}
