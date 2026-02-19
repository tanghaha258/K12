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
import { ScoreSegmentsService } from './score-segments.service';
import { CreateScoreSegmentDto, UpdateScoreSegmentDto, QueryScoreSegmentDto } from './dto/score-segment.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('分段规则')
@Controller('score-segments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ScoreSegmentsController {
  constructor(private readonly scoreSegmentsService: ScoreSegmentsService) {}

  @Get('default/:gradeId')
  @ApiOperation({ summary: '获取默认分段规则' })
  getDefault(
    @Param('gradeId') gradeId: string,
    @Query('subjectId') subjectId?: string,
  ) {
    return this.scoreSegmentsService.getDefaultSegment(gradeId, subjectId);
  }

  @Get()
  @ApiOperation({ summary: '获取分段规则列表' })
  findAll(@Query() query: QueryScoreSegmentDto) {
    return this.scoreSegmentsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取分段规则详情' })
  findOne(@Param('id') id: string) {
    return this.scoreSegmentsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: '创建分段规则' })
  create(@Body() createDto: CreateScoreSegmentDto) {
    return this.scoreSegmentsService.create(createDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新分段规则' })
  update(@Param('id') id: string, @Body() updateDto: UpdateScoreSegmentDto) {
    return this.scoreSegmentsService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除分段规则' })
  remove(@Param('id') id: string) {
    return this.scoreSegmentsService.remove(id);
  }
}
