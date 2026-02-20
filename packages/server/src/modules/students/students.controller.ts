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
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { StudentsService } from './students.service';
import { CreateStudentDto, UpdateStudentDto, QueryStudentDto } from './dto/student.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequestWithUser } from '../../common/types/express.d';

@ApiTags('学生管理')
@Controller('students')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Post()
  @ApiOperation({ summary: '创建学生' })
  create(@Body() createStudentDto: CreateStudentDto) {
    return this.studentsService.create(createStudentDto);
  }

  @Get()
  @ApiOperation({ summary: '获取学生列表' })
  findAll(@Query() query: QueryStudentDto) {
    return this.studentsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取学生详情' })
  findOne(@Param('id') id: string) {
    return this.studentsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新学生信息' })
  update(
    @Param('id') id: string,
    @Body() updateStudentDto: UpdateStudentDto,
    @Request() req: RequestWithUser
  ) {
    return this.studentsService.update(id, updateStudentDto, req.user.id);
  }

  @Patch(':id/profile')
  @ApiOperation({ summary: '更新学生档案信息' })
  updateProfile(
    @Param('id') id: string,
    @Body() updateStudentDto: UpdateStudentDto,
    @Request() req: RequestWithUser
  ) {
    return this.studentsService.update(id, updateStudentDto, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除学生' })
  remove(@Param('id') id: string) {
    return this.studentsService.remove(id);
  }

  @Post('batch-import')
  @ApiOperation({ summary: '批量导入学生' })
  batchImport(@Body() students: CreateStudentDto[]) {
    return this.studentsService.batchImport(students);
  }
}
