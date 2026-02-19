import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';

const DICT_TYPES = [
  { code: 'gender', name: '性别', description: '男、女' },
  { code: 'user_status', name: '用户状态', description: '启用、停用、待激活' },
  { code: 'exam_type', name: '考试类型', description: '月考、期中、期末、模拟考' },
  { code: 'score_level', name: '成绩等级', description: '优秀、良好、及格、不及格' },
];

@Injectable()
export class DictService {
  constructor(private prisma: PrismaService) {}

  async getTypes() {
    return DICT_TYPES;
  }

  async findByType(type: string) {
    switch (type) {
      case 'gender':
        return [
          { id: 'male', code: 'male', name: '男', sort: 1 },
          { id: 'female', code: 'female', name: '女', sort: 2 },
        ];
      case 'user_status':
        return [
          { id: 'ACTIVE', code: 'ACTIVE', name: '启用', sort: 1 },
          { id: 'INACTIVE', code: 'INACTIVE', name: '停用', sort: 2 },
          { id: 'PENDING', code: 'PENDING', name: '待激活', sort: 3 },
        ];
      case 'exam_type':
        return [
          { id: 'monthly', code: 'monthly', name: '月考', sort: 1 },
          { id: 'midterm', code: 'midterm', name: '期中考试', sort: 2 },
          { id: 'final', code: 'final', name: '期末考试', sort: 3 },
          { id: 'mock', code: 'mock', name: '模拟考试', sort: 4 },
        ];
      case 'score_level':
        return [
          { id: 'excellent', code: 'excellent', name: '优秀', sort: 1 },
          { id: 'good', code: 'good', name: '良好', sort: 2 },
          { id: 'pass', code: 'pass', name: '及格', sort: 3 },
          { id: 'fail', code: 'fail', name: '不及格', sort: 4 },
        ];
      default:
        return [];
    }
  }

  async create(
    type: string,
    data: { code: string; name: string; sort?: number; remark?: string },
  ) {
    return {
      id: `${type}_${Date.now()}`,
      type,
      ...data,
      status: 'ACTIVE',
      createdAt: new Date(),
    };
  }

  async update(
    type: string,
    id: string,
    data: { name?: string; sort?: number; remark?: string; status?: string },
  ) {
    return {
      id,
      type,
      ...data,
      updatedAt: new Date(),
    };
  }

  async delete(type: string, id: string) {
    return { success: true };
  }

  async getSubjects() {
    return this.prisma.subjects.findMany({
      include: {
        subject_grades: {
          include: {
            grades: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getSubjectsByGrade(gradeId: string) {
    return this.prisma.subjects.findMany({
      where: {
        subject_grades: {
          some: {
            gradeId,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async createSubject(data: { code: string; name: string; gradeIds?: string[] }) {
    const existing = await this.prisma.subjects.findUnique({
      where: { code: data.code },
    });
    if (existing) {
      throw new BadRequestException('科目编码已存在');
    }

    const { gradeIds, ...subjectData } = data;

    return this.prisma.subjects.create({
      data: {
        id: uuidv4(),
        ...subjectData,
        updatedAt: new Date(),
        subject_grades: gradeIds ? {
          create: gradeIds.map(gradeId => ({
            id: uuidv4(),
            gradeId,
          })),
        } : undefined,
      },
      include: {
        subject_grades: {
          include: {
            grades: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });
  }

  async updateSubject(id: string, data: { name?: string; code?: string; gradeIds?: string[] }) {
    const subject = await this.prisma.subjects.findUnique({ where: { id } });
    if (!subject) {
      throw new NotFoundException('科目不存在');
    }

    if (data.code && data.code !== subject.code) {
      const existing = await this.prisma.subjects.findUnique({
        where: { code: data.code },
      });
      if (existing) {
        throw new BadRequestException('科目编码已存在');
      }
    }

    const { gradeIds, ...updateData } = data;

    if (gradeIds !== undefined) {
      await this.prisma.subject_grades.deleteMany({
        where: { subjectId: id },
      });
    }

    return this.prisma.subjects.update({
      where: { id },
      data: {
        ...updateData,
        subject_grades: gradeIds ? {
          create: gradeIds.map(gradeId => ({
            id: uuidv4(),
            gradeId,
          })),
        } : undefined,
      },
      include: {
        subject_grades: {
          include: {
            grades: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });
  }

  async deleteSubject(id: string) {
    const subject = await this.prisma.subjects.findUnique({ where: { id } });
    if (!subject) {
      throw new NotFoundException('科目不存在');
    }

    await this.prisma.subject_grades.deleteMany({
      where: { subjectId: id },
    });

    return this.prisma.subjects.delete({
      where: { id },
    });
  }
}
