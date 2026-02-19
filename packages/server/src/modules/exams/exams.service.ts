import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateExamDto, UpdateExamDto, QueryExamDto, AddExamSubjectDto, UpdateExamSubjectDto } from './dto/exam.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ExamsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: QueryExamDto) {
    const where: any = {};

    if (query.gradeId) where.gradeId = query.gradeId;
    if (query.type) where.type = query.type;
    if (query.schoolYear) where.schoolYear = query.schoolYear;
    if (query.term) where.term = query.term;
    if (query.status) where.status = query.status;
    if (query.search) {
      where.name = { contains: query.search };
    }

    return this.prisma.exams.findMany({
      where,
      include: {
        grades: { select: { id: true, name: true } },
        exam_subjects: {
          include: {
            subjects: { select: { id: true, name: true, code: true } },
          },
          orderBy: { subjects: { code: 'asc' } },
        },
        _count: { select: { scores: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const exam = await this.prisma.exams.findUnique({
      where: { id },
      include: {
        grades: { select: { id: true, name: true } },
        exam_subjects: {
          include: {
            subjects: { select: { id: true, name: true, code: true } },
          },
          orderBy: { subjects: { code: 'asc' } },
        },
        _count: { select: { scores: true } },
      },
    });

    if (!exam) {
      throw new NotFoundException('考试不存在');
    }

    return exam;
  }

  async create(createDto: CreateExamDto) {
    const grade = await this.prisma.grades.findUnique({
      where: { id: createDto.gradeId },
    });

    if (!grade) {
      throw new NotFoundException('年级不存在');
    }

    const { subjects, ...examData } = createDto;

    const exam = await this.prisma.exams.create({
      data: {
        id: uuidv4(),
        ...examData,
        startTime: examData.startTime ? new Date(examData.startTime) : undefined,
        endTime: examData.endTime ? new Date(examData.endTime) : undefined,
        updatedAt: new Date(),
        exam_subjects: subjects
          ? {
              create: subjects.map((s) => ({
                id: uuidv4(),
                subjectId: s.subjectId,
                maxScore: s.maxScore,
                excellentLine: s.excellentLine || s.maxScore * 0.9,
                passLine: s.passLine || s.maxScore * 0.6,
                lowLine: s.lowLine || s.maxScore * 0.3,
                weight: s.weight || 1,
                includeInTotal: s.includeInTotal !== undefined ? s.includeInTotal : true,
                includeInRank: s.includeInRank !== undefined ? s.includeInRank : true,
              })),
            }
          : undefined,
      },
      include: {
        grades: { select: { id: true, name: true } },
        exam_subjects: {
          include: {
            subjects: { select: { id: true, name: true, code: true } },
          },
        },
      },
    });

    return exam;
  }

  async update(id: string, updateDto: UpdateExamDto) {
    const exam = await this.prisma.exams.findUnique({ where: { id } });

    if (!exam) {
      throw new NotFoundException('考试不存在');
    }

    if (exam.status === 'archived') {
      throw new BadRequestException('已归档的考试不能修改');
    }

    const updateData: any = { ...updateDto, updatedAt: new Date() };
    if (updateDto.startTime) {
      updateData.startTime = new Date(updateDto.startTime);
    }
    if (updateDto.endTime) {
      updateData.endTime = new Date(updateDto.endTime);
    }

    return this.prisma.exams.update({
      where: { id },
      data: updateData,
      include: {
        grades: { select: { id: true, name: true } },
        exam_subjects: {
          include: {
            subjects: { select: { id: true, name: true, code: true } },
          },
        },
      },
    });
  }

  async remove(id: string) {
    const exam = await this.prisma.exams.findUnique({
      where: { id },
      include: {
        _count: { select: { scores: true } },
      },
    });

    if (!exam) {
      throw new NotFoundException('考试不存在');
    }

    if (exam._count.scores > 0) {
      throw new BadRequestException('该考试已有成绩数据，无法删除');
    }

    await this.prisma.exam_subjects.deleteMany({
      where: { examId: id },
    });

    return this.prisma.exams.delete({
      where: { id },
    });
  }

  async addSubject(examId: string, addDto: AddExamSubjectDto) {
    const exam = await this.prisma.exams.findUnique({ where: { id: examId } });

    if (!exam) {
      throw new NotFoundException('考试不存在');
    }

    if (exam.status === 'archived') {
      throw new BadRequestException('已归档的考试不能添加科目');
    }

    const existing = await this.prisma.exam_subjects.findUnique({
      where: {
        examId_subjectId: {
          examId,
          subjectId: addDto.subjectId,
        },
      },
    });

    if (existing) {
      throw new BadRequestException('该科目已存在');
    }

    return this.prisma.exam_subjects.create({
      data: {
        id: uuidv4(),
        examId,
        subjectId: addDto.subjectId,
        maxScore: addDto.maxScore,
        excellentLine: addDto.excellentLine || addDto.maxScore * 0.9,
        passLine: addDto.passLine || addDto.maxScore * 0.6,
        lowLine: addDto.lowLine || addDto.maxScore * 0.3,
        weight: addDto.weight || 1,
        includeInTotal: addDto.includeInTotal !== undefined ? addDto.includeInTotal : true,
        includeInRank: addDto.includeInRank !== undefined ? addDto.includeInRank : true,
      },
      include: {
        subjects: { select: { id: true, name: true, code: true } },
      },
    });
  }

  async updateSubject(examId: string, subjectId: string, updateDto: UpdateExamSubjectDto) {
    const examSubject = await this.prisma.exam_subjects.findUnique({
      where: {
        examId_subjectId: { examId, subjectId },
      },
    });

    if (!examSubject) {
      throw new NotFoundException('考试科目不存在');
    }

    return this.prisma.exam_subjects.update({
      where: { id: examSubject.id },
      data: updateDto,
      include: {
        subjects: { select: { id: true, name: true, code: true } },
      },
    });
  }

  async removeSubject(examId: string, subjectId: string) {
    const exam = await this.prisma.exams.findUnique({ where: { id: examId } });

    if (!exam) {
      throw new NotFoundException('考试不存在');
    }

    if (exam.status === 'archived') {
      throw new BadRequestException('已归档的考试不能删除科目');
    }

    const examSubject = await this.prisma.exam_subjects.findUnique({
      where: {
        examId_subjectId: { examId, subjectId },
      },
    });

    if (!examSubject) {
      throw new NotFoundException('考试科目不存在');
    }

    return this.prisma.exam_subjects.delete({
      where: { id: examSubject.id },
    });
  }

  async updateStatus(id: string, status: string) {
    const exam = await this.prisma.exams.findUnique({
      where: { id },
      include: { exam_subjects: true },
    });

    if (!exam) {
      throw new NotFoundException('考试不存在');
    }

    const validStatuses = ['draft', 'pending', 'ongoing', 'ended', 'archived'];
    if (!validStatuses.includes(status)) {
      throw new BadRequestException('无效的状态');
    }

    if (status === 'ongoing' || status === 'ended') {
      if (exam.exam_subjects.length === 0) {
        throw new BadRequestException('请先添加考试科目');
      }
    }

    return this.prisma.exams.update({
      where: { id },
      data: { status, updatedAt: new Date() },
    });
  }

  async getStatistics(id: string) {
    const exam = await this.prisma.exams.findUnique({
      where: { id },
      include: {
        grades: { select: { id: true, name: true } },
        exam_subjects: {
          include: {
            subjects: { select: { id: true, name: true, code: true } },
            _count: { select: { scores: true } },
          },
        },
        _count: { select: { scores: true } },
      },
    });

    if (!exam) {
      throw new NotFoundException('考试不存在');
    }

    const studentCount = await this.prisma.students.count({
      where: { gradeId: exam.gradeId },
    });

    return {
      ...exam,
      studentCount,
      enteredCount: exam._count.scores / (exam.exam_subjects.length || 1),
    };
  }

  async copyExam(id: string, newName: string) {
    const exam = await this.prisma.exams.findUnique({
      where: { id },
      include: { exam_subjects: true },
    });

    if (!exam) {
      throw new NotFoundException('考试不存在');
    }

    const newExam = await this.prisma.exams.create({
      data: {
        id: uuidv4(),
        name: newName,
        type: exam.type,
        term: exam.term,
        schoolYear: exam.schoolYear,
        gradeId: exam.gradeId,
        status: 'draft',
        updatedAt: new Date(),
        exam_subjects: {
          create: exam.exam_subjects.map((es) => ({
            id: uuidv4(),
            subjectId: es.subjectId,
            maxScore: es.maxScore,
            excellentLine: es.excellentLine,
            passLine: es.passLine,
            lowLine: es.lowLine,
            weight: es.weight,
            includeInTotal: es.includeInTotal,
            includeInRank: es.includeInRank,
          })),
        },
      },
      include: {
        grades: { select: { id: true, name: true } },
        exam_subjects: {
          include: {
            subjects: { select: { id: true, name: true, code: true } },
          },
        },
      },
    });

    return newExam;
  }
}
