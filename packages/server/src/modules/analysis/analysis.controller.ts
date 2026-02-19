import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AnalysisService } from './analysis.service';
import { AnalysisQueryDto, ProgressAnalysisDto, CriticalStudentDto, SubjectBalanceDto } from './dto/analysis.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('成绩分析')
@Controller('analysis')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AnalysisController {
  constructor(private readonly analysisService: AnalysisService) {}

  @Get('statistics')
  @ApiOperation({ summary: '获取基础统计数据' })
  getBasicStatistics(@Query() dto: AnalysisQueryDto) {
    return this.analysisService.getBasicStatistics(dto);
  }

  @Get('class-comparison')
  @ApiOperation({ summary: '获取班级对比分析' })
  getClassComparison(@Query() dto: AnalysisQueryDto) {
    return this.analysisService.getClassComparison(dto);
  }

  @Get('progress')
  @ApiOperation({ summary: '获取进退步分析' })
  getProgressAnalysis(@Query() dto: ProgressAnalysisDto) {
    return this.analysisService.getProgressAnalysis(dto);
  }

  @Get('critical-students')
  @ApiOperation({ summary: '获取临界生分析' })
  getCriticalStudents(@Query() dto: CriticalStudentDto) {
    return this.analysisService.getCriticalStudents(dto);
  }

  @Get('subject-balance')
  @ApiOperation({ summary: '获取学科均衡度分析' })
  getSubjectBalance(@Query() dto: SubjectBalanceDto) {
    return this.analysisService.getSubjectBalance(dto);
  }

  @Get('radar')
  @ApiOperation({ summary: '获取雷达图数据' })
  getRadarData(@Query() dto: AnalysisQueryDto) {
    return this.analysisService.getRadarData(dto);
  }
}
