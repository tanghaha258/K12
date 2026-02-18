import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateScoreLineDto, UpdateScoreLineDto, QueryScoreLineDto, ScoreLineType } from './dto/score-line.dto';

@Injectable()
export class ScoreLinesService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: QueryScoreLineDto) {
    const where: any = {};
    
    if (query.gradeId) {
      where.gradeId = query.gradeId;
    }
    
    if (query.type) {
      where.type = query.type;
    }
    
    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    return this.prisma.score_lines.findMany({
      where,
      include: {
        grades: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const line = await this.prisma.score_lines.findUnique({
      where: { id },
      include: {
        grades: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!line) {
      throw new NotFoundException('线位配置不存�?);
    }

    return line;
  }

  async create(createDto: CreateScoreLineDto) {
    // 检查年级是否存�?    const grade = await this.prisma.grades.findUnique({
      where: { id: createDto.gradeId },
    });

    if (!grade) {
      throw new NotFoundException('年级不存�?);
    }

    return this.prisma.score_lines.create({
      data: createDto,
      include: {
        grades: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async update(id: string, updateDto: UpdateScoreLineDto) {
    const line = await this.prisma.score_lines.findUnique({
      where: { id },
    });

    if (!line) {
      throw new NotFoundException('线位配置不存�?);
    }

    return this.prisma.score_lines.update({
      where: { id },
      data: updateDto,
      include: {
        grades: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async remove(id: string) {
    const line = await this.prisma.score_lines.findUnique({
      where: { id },
    });

    if (!line) {
      throw new NotFoundException('线位配置不存�?);
    }

    return this.prisma.score_lines.delete({
      where: { id },
    });
  }

  // 获取指定年级的线位配�?  async getLinesByGrade(gradeId: string) {
    return this.prisma.score_lines.findMany({
      where: {
        gradeId,
        isActive: true,
      },
      orderBy: {
        type: 'asc',
      },
    });
  }

  // 获取指定年级和类型的线位
  async getLineByType(gradeId: string, type: ScoreLineType) {
    return this.prisma.score_lines.findFirst({
      where: {
        gradeId,
        type,
        isActive: true,
      },
    });
  }
}
