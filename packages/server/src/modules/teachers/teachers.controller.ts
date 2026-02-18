import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TeachersService } from './teachers.service';
import { CreateTeacherDto, UpdateTeacherDto, AssignClassDto, QueryTeacherDto } from './dto/teacher.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('教师管理')
@Controller('teachers')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TeachersController {
  constructor(private readonly teachersService: TeachersService) {}

  @Post()
  @ApiOperation({ summary: '创建教师' })
  create(@Body() createTeacherDto: CreateTeacherDto) {
    return this.teachersService.create(createTeacherDto);
  }

  @Get()
  @ApiOperation({ summary: '获取教师列表' })
  findAll(@Query() query: QueryTeacherDto) {
    return this.teachersService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取教师详情' })
  findOne(@Param('id') id: string) {
    return this.teachersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新教师信息' })
  update(@Param('id') id: string, @Body() updateTeacherDto: UpdateTeacherDto) {
    return this.teachersService.update(id, updateTeacherDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除教师' })
  remove(@Param('id') id: string) {
    return this.teachersService.remove(id);
  }

  @Post(':id/classes')
  @ApiOperation({ summary: '分配班级科目' })
  assignClass(@Param('id') id: string, @Body() assignClassDto: AssignClassDto) {
    return this.teachersService.assignClass(id, assignClassDto);
  }

  @Delete(':id/classes/:classId/subjects/:subjectId')
  @ApiOperation({ summary: '移除班级科目分配' })
  removeClassAssignment(
    @Param('id') id: string,
    @Param('classId') classId: string,
    @Param('subjectId') subjectId: string
  ) {
    return this.teachersService.removeClassAssignment(id, classId, subjectId);
  }

  @Put(':id/head-teacher/:classId')
  @ApiOperation({ summary: '设为班主�? })
  setAsHeadTeacher(@Param('id') id: string, @Param('classId') classId: string) {
    return this.teachersService.setAsHeadTeacher(id, classId);
  }
}
