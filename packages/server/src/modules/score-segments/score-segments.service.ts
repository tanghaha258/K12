import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateScoreSegmentDto, UpdateScoreSegmentDto, QueryScoreSegmentDto } from './dto/score-segment.dto';

@Injectable()
export class ScoreSegmentsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: QueryScoreSegmentDto) {
    const where: any = {};
    
    if (query.gradeId) {
      where.gradeId = query.gradeId;
    }
    
    if (query.subjectId) {
      where.subjectId = query.subjectId;
    }
    
    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    return this.prisma.score_segments.findMany({
      where,
      include: {
        grades: {
          select: {
            id: true,
            name: true,
          },
        },
        subjects: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const segment = await this.prisma.score_segments.findUnique({
      where: { id },
      include: {
        grades: {
          select: {
            id: true,
            name: true,
          },
        },
        subjects: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    if (!segment) {
      throw new NotFoundException('分段规则不存�?);
    }

    return segment;
  }

  async create(createDto: CreateScoreSegmentDto) {
    // 检查年级是否存�?    const grade = await this.prisma.grades.findUnique({
      where: { id: createDto.gradeId },
    });

    if (!grade) {
      throw new NotFoundException('年级不存�?);
    }

    // 如果指定了科目，检查科目是否存�?    if (createDto.subjectId) {
      const subject = await this.prisma.subjects.findUnique({
        where: { id: createDto.subjectId },
      });

      if (!subject) {
        throw new NotFoundException('科目不存�?);
      }
    }

    // 如果设置为默认规则，先将同年级同科目的其他规则设为非默认
    if (createDto.isDefault) {
      await this.prisma.score_segments.updateMany({
        where: {
          gradeId: createDto.gradeId,
          subjectId: createDto.subjectId || null,
        },
        data: { isDefault: false },
      });
    }

    return this.prisma.score_segments.create({
      data: createDto,
      include: {
        grades: {
          select: {
            id: true,
            name: true,
          },
        },
        subjects: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });
  }

  async update(id: string, updateDto: UpdateScoreSegmentDto) {
    const segment = await this.prisma.score_segments.findUnique({
      where: { id },
    });

    if (!segment) {
      throw new NotFoundException('分段规则不存�?);
    }

    // 如果设置为默认规则，先将同年级同科目的其他规则设为非默认
    if (updateDto.isDefault) {
      await this.prisma.score_segments.updateMany({
        where: {
          gradeId: segment.gradeId,
          subjectId: segment.subjectId,
          id: { not: id },
        },
        data: { isDefault: false },
      });
    }

    return this.prisma.score_segments.update({
      where: { id },
      data: updateDto,
      include: {
        grades: {
          select: {
            id: true,
            name: true,
          },
        },
        subjects: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });
  }

  async remove(id: string) {
    const segment = await this.prisma.score_segments.findUnique({
      where: { id },
    });

    if (!segment) {
      throw new NotFoundException('分段规则不存�?);
    }

    return this.prisma.score_segments.delete({
      where: { id },
    });
  }

  // 获取指定年级和科目的默认分段规则
  async getDefaultSegment(gradeId: string, subjectId?: string) {
    const where: any = {
      gradeId,
      isDefault: true,
      isActive: true,
    };

    if (subjectId) {
      where.OR = [
        { subjectId },
        { subjectId: null },
      ];
    }

    return this.prisma.score_segments.findFirst({
      where,
      orderBy: {
        subjectId: 'desc', // 优先返回科目特定的规�?      },
    });
  }
}
