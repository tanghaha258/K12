import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateClassDto, UpdateClassDto, QueryClassDto, AssignTeachersDto } from './dto/class.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ClassesService {
  constructor(private prisma: PrismaService) {}

  async create(createClassDto: CreateClassDto) {
    const grade = await this.prisma.grades.findUnique({
      where: { id: createClassDto.gradeId },
    });
    if (!grade) {
      throw new NotFoundException('年级不存在');
    }

    return this.prisma.classes.create({
      data: {
        id: uuidv4(),
        ...createClassDto,
        updatedAt: new Date(),
      },
      include: { grades: true },
    });
  }

  async findAll(query?: QueryClassDto) {
    const where: any = {};
    if (query?.gradeId) {
      where.gradeId = query.gradeId;
    }

    return this.prisma.classes.findMany({
      where,
      include: {
        grades: true,
        teachers: {
          select: {
            id: true,
            name: true,
            teacherNo: true,
          },
        },
        _count: {
          select: { students: true },
        },
      },
      orderBy: [{ gradeId: 'asc' }, { name: 'asc' }],
    });
  }

  async findOne(id: string) {
    const classEntity = await this.prisma.classes.findUnique({
      where: { id },
      include: {
        grades: true,
        students: {
          select: {
            id: true,
            studentNo: true,
            users: {
              select: {
                name: true,
              },
            },
          },
        },
        teachers: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!classEntity) {
      throw new NotFoundException('班级不存在');
    }

    return classEntity;
  }

  async update(id: string, updateClassDto: UpdateClassDto) {
    const classEntity = await this.prisma.classes.findUnique({
      where: { id },
    });

    if (!classEntity) {
      throw new NotFoundException('班级不存在');
    }

    return this.prisma.classes.update({
      where: { id },
      data: updateClassDto,
      include: {
        grades: true,
        teachers: {
          select: {
            id: true,
            name: true,
            teacherNo: true,
          },
        },
      },
    });
  }

  async remove(id: string) {
    const classEntity = await this.prisma.classes.findUnique({
      where: { id },
    });

    if (!classEntity) {
      throw new NotFoundException('班级不存在');
    }

    const studentCount = await this.prisma.students.count({
      where: { classId: id },
    });

    if (studentCount > 0) {
      throw new NotFoundException('该班级下存在学生，无法删除');
    }

    return this.prisma.classes.delete({
      where: { id },
    });
  }

  async assignTeachers(id: string, assignTeachersDto: AssignTeachersDto) {
    const classEntity = await this.prisma.classes.findUnique({
      where: { id },
    });

    if (!classEntity) {
      throw new NotFoundException('班级不存在');
    }

    await this.prisma.teacher_classes.deleteMany({
      where: { classId: id },
    });

    if (assignTeachersDto.teacherIds.length > 0) {
      await this.prisma.teacher_classes.createMany({
        data: assignTeachersDto.teacherIds.map((teacherId) => ({
          id: uuidv4(),
          classId: id,
          teacherId,
          subjectId: assignTeachersDto.subjectId,
        })),
      });
    }

    return this.findOne(id);
  }
}
