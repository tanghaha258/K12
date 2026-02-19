import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateTeacherDto, UpdateTeacherDto, AssignClassDto, QueryTeacherDto } from './dto/teacher.dto';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class TeachersService {
  constructor(private prisma: PrismaService) {}

  async create(createTeacherDto: CreateTeacherDto) {
    const existingTeacher = await this.prisma.teachers.findUnique({
      where: { teacherNo: createTeacherDto.teacherNo },
    });

    if (existingTeacher) {
      throw new ConflictException('工号已存在');
    }

    const hashedPassword = await bcrypt.hash(createTeacherDto.teacherNo, 10);

    const teacherRole = await this.prisma.roles.findUnique({
      where: { code: 'SUBJECT_TEACHER' },
    });

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.users.create({
        data: {
          id: uuidv4(),
          account: createTeacherDto.teacherNo,
          password: hashedPassword,
          name: createTeacherDto.name,
          role: 'SUBJECT_TEACHER',
          roleId: teacherRole?.id || '',
          status: 'ACTIVE',
          updatedAt: new Date(),
        },
      });

      const teacher = await tx.teachers.create({
        data: {
          id: uuidv4(),
          userId: user.id,
          teacherNo: createTeacherDto.teacherNo,
          name: createTeacherDto.name,
          updatedAt: new Date(),
        },
        include: {
          users: { select: { id: true, name: true, account: true, status: true } },
        },
      });

      return teacher;
    });
  }

  async findAll(query?: QueryTeacherDto) {
    const where: any = {};
    if (query?.search) {
      where.OR = [
        { name: { contains: query.search } },
        { teacherNo: { contains: query.search } },
      ];
    }

    return this.prisma.teachers.findMany({
      where,
      include: {
        users: { select: { id: true, name: true, account: true, status: true } },
        teacher_classes: {
          include: {
            classes: { include: { grades: true } },
            subjects: true,
          },
        },
      },
    }).then(teachers => teachers.map(teacher => ({
      id: teacher.id,
      teacherNo: teacher.teacherNo,
      name: teacher.name,
      user: teacher.users,
      classes: teacher.teacher_classes.map(tc => ({
        id: tc.id,
        classId: tc.classId,
        className: tc.classes?.name,
        gradeName: tc.classes?.grades?.name,
        subjectId: tc.subjectId,
        subjectName: tc.subjects?.name,
      })),
    })));
  }

  async findOne(id: string) {
    const teacher = await this.prisma.teachers.findUnique({
      where: { id },
      include: {
        users: { select: { id: true, name: true, account: true, status: true } },
        teacher_classes: {
          include: {
            classes: { include: { grades: true } },
            subjects: true,
          },
        },
      },
    });

    if (!teacher) {
      throw new NotFoundException('教师不存在');
    }

    return {
      id: teacher.id,
      teacherNo: teacher.teacherNo,
      name: teacher.name,
      user: teacher.users,
      classes: teacher.teacher_classes.map(tc => ({
        id: tc.id,
        classId: tc.classId,
        className: tc.classes?.name,
        gradeName: tc.classes?.grades?.name,
        subjectId: tc.subjectId,
        subjectName: tc.subjects?.name,
      })),
    };
  }

  async update(id: string, updateTeacherDto: UpdateTeacherDto) {
    const teacher = await this.prisma.teachers.findUnique({
      where: { id },
    });

    if (!teacher) {
      throw new NotFoundException('教师不存在');
    }

    return this.prisma.teachers.update({
      where: { id },
      data: updateTeacherDto,
      include: {
        users: { select: { id: true, name: true, account: true, status: true } },
      },
    });
  }

  async remove(id: string) {
    const teacher = await this.prisma.teachers.findUnique({
      where: { id },
    });

    if (!teacher) {
      throw new NotFoundException('教师不存在');
    }

    await this.prisma.teacher_classes.deleteMany({
      where: { teacherId: id },
    });

    await this.prisma.teachers.delete({
      where: { id },
    });

    await this.prisma.users.delete({
      where: { id: teacher.userId },
    });

    return { success: true };
  }

  async assignClass(id: string, assignClassDto: AssignClassDto) {
    const teacher = await this.prisma.teachers.findUnique({
      where: { id },
    });

    if (!teacher) {
      throw new NotFoundException('教师不存在');
    }

    const classEntity = await this.prisma.classes.findUnique({
      where: { id: assignClassDto.classId },
    });

    if (!classEntity) {
      throw new NotFoundException('班级不存在');
    }

    const subject = await this.prisma.subjects.findUnique({
      where: { id: assignClassDto.subjectId },
    });

    if (!subject) {
      throw new NotFoundException('科目不存在');
    }

    const existing = await this.prisma.teacher_classes.findFirst({
      where: {
        teacherId: id,
        classId: assignClassDto.classId,
        subjectId: assignClassDto.subjectId,
      },
    });

    if (existing) {
      throw new ConflictException('该教师已教授此班级的此科目');
    }

    return this.prisma.teacher_classes.create({
      data: {
        id: uuidv4(),
        teacherId: id,
        classId: assignClassDto.classId,
        subjectId: assignClassDto.subjectId,
      },
      include: {
        classes: true,
        subjects: true,
      },
    });
  }

  async removeClassAssignment(id: string, classId: string, subjectId: string) {
    const teacher = await this.prisma.teachers.findUnique({
      where: { id },
    });

    if (!teacher) {
      throw new NotFoundException('教师不存在');
    }

    await this.prisma.teacher_classes.deleteMany({
      where: {
        teacherId: id,
        classId,
        subjectId,
      },
    });

    return { success: true };
  }

  async setAsHeadTeacher(id: string, classId: string) {
    const teacher = await this.prisma.teachers.findUnique({
      where: { id },
    });

    if (!teacher) {
      throw new NotFoundException('教师不存在');
    }

    const classEntity = await this.prisma.classes.findUnique({
      where: { id: classId },
    });

    if (!classEntity) {
      throw new NotFoundException('班级不存在');
    }

    // 更新班级的班主任
    await this.prisma.classes.update({
      where: { id: classId },
      data: { headTeacherId: id },
    });

    return { success: true };
  }
}
