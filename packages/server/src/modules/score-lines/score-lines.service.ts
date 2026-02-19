import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateScoreLineDto, UpdateScoreLineDto, QueryScoreLineDto, ScoreLineType } from './dto/score-line.dto';
import { v4 as uuidv4 } from 'uuid';

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
      throw new NotFoundException('线位配置不存在');
    }

    return line;
  }

  async create(createDto: CreateScoreLineDto) {
    // 检查年级是否存在
    const grade = await this.prisma.grades.findUnique({
      where: { id: createDto.gradeId },
    });

    if (!grade) {
      throw new NotFoundException('年级不存在');
    }

    return this.prisma.score_lines.create({
      data: {
        ...createDto,
        id: uuidv4(),
        updatedAt: new Date(),
      },
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
      throw new NotFoundException('线位配置不存在');
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
      throw new NotFoundException('线位配置不存在');
    }

    return this.prisma.score_lines.delete({
      where: { id },
    });
  }

  // 获取指定年级的线位配置
  async getByGrade(gradeId: string) {
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
  async getByType(gradeId: string, type: string) {
    return this.prisma.score_lines.findFirst({
      where: {
        gradeId,
        type: type as any,
        isActive: true,
      },
    });
  }
}
