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
import { ClassesService } from './classes.service';
import { CreateClassDto, UpdateClassDto, QueryClassDto, AssignTeachersDto } from './dto/class.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('组织管理 - 班级')
@Controller('org/classes')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

  @Post()
  @ApiOperation({ summary: '创建班级' })
  create(@Body() createClassDto: CreateClassDto) {
    return this.classesService.create(createClassDto);
  }

  @Get()
  @ApiOperation({ summary: '获取班级列表' })
  findAll(@Query() query: QueryClassDto) {
    return this.classesService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取班级详情' })
  findOne(@Param('id') id: string) {
    return this.classesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新班级' })
  update(@Param('id') id: string, @Body() updateClassDto: UpdateClassDto) {
    return this.classesService.update(id, updateClassDto);
  }

  @Post(':id/teachers')
  @ApiOperation({ summary: '分配科任老师' })
  assignTeachers(@Param('id') id: string, @Body() assignTeachersDto: AssignTeachersDto) {
    return this.classesService.assignTeachers(id, assignTeachersDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除班级' })
  remove(@Param('id') id: string) {
    return this.classesService.remove(id);
  }
}
