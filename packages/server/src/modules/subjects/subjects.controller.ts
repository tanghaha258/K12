import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PrismaService } from '../../common/prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('科目管理')
@Controller('subjects')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SubjectsController {
  constructor(private prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: '获取科目列表' })
  findAll() {
    return this.prisma.subjects.findMany({
      orderBy: { name: 'asc' },
    });
  }
}
