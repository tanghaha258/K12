import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ExamsService } from './exams.service';
import {
  CreateExamDto,
  UpdateExamDto,
  QueryExamDto,
  AddExamSubjectDto,
  UpdateExamSubjectDto,
} from './dto/exam.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('考试管理')
@Controller('exams')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ExamsController {
  constructor(private readonly examsService: ExamsService) {}

  @Get()
  @ApiOperation({ summary: '获取考试列表' })
  findAll(@Query() query: QueryExamDto) {
    return this.examsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取考试详情' })
  findOne(@Param('id') id: string) {
    return this.examsService.findOne(id);
  }

  @Get(':id/statistics')
  @ApiOperation({ summary: '获取考试统计' })
  getStatistics(@Param('id') id: string) {
    return this.examsService.getStatistics(id);
  }

  @Post()
  @ApiOperation({ summary: '创建考试' })
  create(@Body() createDto: CreateExamDto) {
    return this.examsService.create(createDto);
  }

  @Post(':id/copy')
  @ApiOperation({ summary: '复制考试' })
  copyExam(@Param('id') id: string, @Body('name') name: string) {
    return this.examsService.copyExam(id, name);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新考试' })
  update(@Param('id') id: string, @Body() updateDto: UpdateExamDto) {
    return this.examsService.update(id, updateDto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: '更新考试状态' })
  updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.examsService.updateStatus(id, status);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除考试' })
  remove(@Param('id') id: string) {
    return this.examsService.remove(id);
  }

  @Post(':id/subjects')
  @ApiOperation({ summary: '添加考试科目' })
  addSubject(@Param('id') id: string, @Body() addDto: AddExamSubjectDto) {
    return this.examsService.addSubject(id, addDto);
  }

  @Patch(':id/subjects/:subjectId')
  @ApiOperation({ summary: '更新考试科目' })
  updateSubject(
    @Param('id') id: string,
    @Param('subjectId') subjectId: string,
    @Body() updateDto: UpdateExamSubjectDto,
  ) {
    return this.examsService.updateSubject(id, subjectId, updateDto);
  }

  @Delete(':id/subjects/:subjectId')
  @ApiOperation({ summary: '删除考试科目' })
  removeSubject(
    @Param('id') id: string,
    @Param('subjectId') subjectId: string,
  ) {
    return this.examsService.removeSubject(id, subjectId);
  }
}
