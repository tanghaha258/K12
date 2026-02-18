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
import { ScoreLinesService } from './score-lines.service';
import { CreateScoreLineDto, UpdateScoreLineDto, QueryScoreLineDto, ScoreLineType } from './dto/score-line.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('线位配置')
@Controller('score-lines')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ScoreLinesController {
  constructor(private readonly scoreLinesService: ScoreLinesService) {}

  @Get()
  @ApiOperation({ summary: '获取线位配置列表' })
  findAll(@Query() query: QueryScoreLineDto) {
    return this.scoreLinesService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取线位配置详情' })
  findOne(@Param('id') id: string) {
    return this.scoreLinesService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: '创建线位配置' })
  create(@Body() createDto: CreateScoreLineDto) {
    return this.scoreLinesService.create(createDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新线位配置' })
  update(@Param('id') id: string, @Body() updateDto: UpdateScoreLineDto) {
    return this.scoreLinesService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除线位配置' })
  remove(@Param('id') id: string) {
    return this.scoreLinesService.remove(id);
  }

  @Get('grade/:gradeId')
  @ApiOperation({ summary: '获取指定年级的线位配�? })
  getByGrade(@Param('gradeId') gradeId: string) {
    return this.scoreLinesService.getLinesByGrade(gradeId);
  }

  @Get('grade/:gradeId/type/:type')
  @ApiOperation({ summary: '获取指定年级和类型的线位' })
  getByType(
    @Param('gradeId') gradeId: string,
    @Param('type') type: ScoreLineType,
  ) {
    return this.scoreLinesService.getLineByType(gradeId, type);
  }
}
