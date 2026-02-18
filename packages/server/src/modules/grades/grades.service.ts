import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateGradeDto, UpdateGradeDto, QueryGradeDto } from './dto/grade.dto';

@Injectable()
export class GradesService {
  constructor(private prisma: PrismaService) {}

  async create(createGradeDto: CreateGradeDto) {
    return this.prisma.grades.create({
      data: createGradeDto,
    });
  }

  async findAll(query?: QueryGradeDto) {
    const where: any = {};
    if (query?.status) {
      where.status = query.status;
    }

    return this.prisma.grades.findMany({
      where,
      include: {
        _count: {
          select: { classes: true, students: true },
        },
      },
      orderBy: { entryYear: 'desc' },
    });
  }

  async findOne(id: string) {
    const grade = await this.prisma.grades.findUnique({
      where: { id },
      include: {
        classes: {
          include: {
            _count: {
              select: { students: true },
            },
          },
        },
        _count: {
          select: { students: true },
        },
      },
    });

    if (!grade) {
      throw new NotFoundException('年级不存在');
    }

    return grade;
  }

  async update(id: string, updateGradeDto: UpdateGradeDto) {
    const grade = await this.prisma.grades.findUnique({ where: { id } });
    if (!grade) {
      throw new NotFoundException('年级不存在');
    }

    return this.prisma.grades.update({
      where: { id },
      data: updateGradeDto,
    });
  }

  async remove(id: string) {
    const grade = await this.prisma.grades.findUnique({
      where: { id },
      include: {
        _count: {
          select: { students: true, classes: true },
        },
      },
    });

    if (!grade) {
      throw new NotFoundException('年级不存在');
    }

    if (grade._count.students > 0) {
      throw new Error('该年级下还有学生，无法删除');
    }

    if (grade._count.classes > 0) {
      throw new Error('该年级下还有班级，无法删除');
    }

    return this.prisma.grades.delete({
      where: { id },
    });
  }
}
