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
import { DictService } from './dict.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('字典管理')
@Controller('dict')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DictController {
  constructor(private readonly dictService: DictService) {}

  @Get('types')
  @ApiOperation({ summary: '获取字典类型列表' })
  async getDictTypes() {
    return this.dictService.getTypes();
  }

  @Get(':type')
  @ApiOperation({ summary: '获取指定类型的字典数据' })
  async getDictByType(@Param('type') type: string) {
    return this.dictService.findByType(type);
  }

  @Post(':type')
  @ApiOperation({ summary: '添加字典项' })
  async createDict(
    @Param('type') type: string,
    @Body() data: { code: string; name: string; sort?: number; remark?: string },
  ) {
    return this.dictService.create(type, data);
  }

  @Patch(':type/:id')
  @ApiOperation({ summary: '更新字典项' })
  async updateDict(
    @Param('type') type: string,
    @Param('id') id: string,
    @Body() data: { name?: string; sort?: number; remark?: string; status?: string },
  ) {
    return this.dictService.update(type, id, data);
  }

  @Delete(':type/:id')
  @ApiOperation({ summary: '删除字典项' })
  async deleteDict(@Param('type') type: string, @Param('id') id: string) {
    return this.dictService.delete(type, id);
  }

  // 科目管理专用接口
  @Get('subjects/all')
  @ApiOperation({ summary: '获取所有科目' })
  async getSubjects() {
    return this.dictService.getSubjects();
  }

  @Get('subjects/by-grade/:gradeId')
  @ApiOperation({ summary: '根据年级获取科目' })
  async getSubjectsByGrade(@Param('gradeId') gradeId: string) {
    return this.dictService.getSubjectsByGrade(gradeId);
  }

  @Post('subjects')
  @ApiOperation({ summary: '添加科目' })
  async createSubject(@Body() data: { code: string; name: string; maxScore?: number; gradeIds?: string[] }) {
    return this.dictService.createSubject(data);
  }

  @Patch('subjects/:id')
  @ApiOperation({ summary: '更新科目' })
  async updateSubject(
    @Param('id') id: string,
    @Body() data: { name?: string; code?: string; maxScore?: number; gradeIds?: string[] },
  ) {
    return this.dictService.updateSubject(id, data);
  }

  @Delete('subjects/:id')
  @ApiOperation({ summary: '删除科目' })
  async deleteSubject(@Param('id') id: string) {
    return this.dictService.deleteSubject(id);
  }
}
