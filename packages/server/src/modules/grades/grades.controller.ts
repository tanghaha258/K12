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
import { GradesService } from './grades.service';
import { CreateGradeDto, UpdateGradeDto, QueryGradeDto } from './dto/grade.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('组织管理 - 年级')
@Controller('org/grades')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class GradesController {
  constructor(private readonly gradesService: GradesService) {}

  @Post()
  @ApiOperation({ summary: '创建年级' })
  create(@Body() createGradeDto: CreateGradeDto) {
    return this.gradesService.create(createGradeDto);
  }

  @Get()
  @ApiOperation({ summary: '获取年级列表' })
  findAll(@Query() query: QueryGradeDto) {
    return this.gradesService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取年级详情' })
  findOne(@Param('id') id: string) {
    return this.gradesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新年级' })
  update(@Param('id') id: string, @Body() updateGradeDto: UpdateGradeDto) {
    return this.gradesService.update(id, updateGradeDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除年级' })
  remove(@Param('id') id: string) {
    return this.gradesService.remove(id);
  }
}
