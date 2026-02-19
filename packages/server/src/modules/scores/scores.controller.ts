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
  Res,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { Response, Request } from 'express';
import { ScoresService } from './scores.service';
import { CreateScoreDto, BatchScoreDto, QueryScoreDto, UpdateScoreDto, ScoreAnalysisDto, ExcelImportDto } from './dto/score.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('成绩管理')
@Controller('scores')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ScoresController {
  constructor(private readonly scoresService: ScoresService) {}

  @Get('analysis')
  @ApiOperation({ summary: '获取成绩分析' })
  getAnalysis(@Query() dto: ScoreAnalysisDto) {
    return this.scoresService.getAnalysis(dto);
  }

  @Get()
  @ApiOperation({ summary: '获取成绩列表' })
  findAll(@Query() query: QueryScoreDto) {
    return this.scoresService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取成绩详情' })
  findOne(@Param('id') id: string) {
    return this.scoresService.findOne(id);
  }

  @Get('template/:examId')
  @ApiOperation({ summary: '下载成绩导入模板' })
  async downloadTemplate(@Param('examId') examId: string, @Res() res: Response) {
    const buffer = await this.scoresService.generateTemplate(examId);
    const exam = await this.scoresService.getExamInfo(examId);
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(exam.name + '_成绩导入模板.xlsx')}`);
    res.send(buffer);
  }

  @Post()
  @ApiOperation({ summary: '创建成绩' })
  create(@Body() createDto: CreateScoreDto) {
    return this.scoresService.create(createDto);
  }

  @Post('batch')
  @ApiOperation({ summary: '批量导入成绩' })
  batchCreate(@Body() batchDto: BatchScoreDto) {
    return this.scoresService.batchCreate(batchDto);
  }

  @Post('import/:examId')
  @ApiOperation({ summary: '导入Excel成绩文件' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async importExcel(
    @Param('examId') examId: string,
    @Req() req: Request,
  ) {
    return this.scoresService.importFromExcel(examId, req);
  }

  @Post('validate/:examId')
  @ApiOperation({ summary: '校验成绩数据' })
  validateScores(@Param('examId') examId: string, @Body() dto: ExcelImportDto) {
    return this.scoresService.validateScores(examId, dto);
  }

  @Get('export/:examId')
  @ApiOperation({ summary: '导出成绩Excel' })
  async exportScores(
    @Param('examId') examId: string,
    @Query('classId') classId: string,
    @Res() res: Response,
  ) {
    const buffer = await this.scoresService.exportScores(examId, classId);
    const exam = await this.scoresService.getExamInfo(examId);
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(exam.name + '_成绩导出.xlsx')}`);
    res.send(buffer);
  }

  @Post('ranks/:examId')
  @ApiOperation({ summary: '计算排名' })
  calculateRanks(
    @Param('examId') examId: string,
    @Query('subjectId') subjectId?: string,
  ) {
    return this.scoresService.calculateRanks(examId, subjectId);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新成绩' })
  update(@Param('id') id: string, @Body() updateDto: UpdateScoreDto) {
    return this.scoresService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除成绩' })
  remove(@Param('id') id: string) {
    return this.scoresService.remove(id);
  }
}
