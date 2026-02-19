import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AnalysisQueryDto {
  @ApiProperty({ description: '考试ID' })
  @IsString()
  @IsNotEmpty()
  examId: string;

  @ApiPropertyOptional({ description: '科目ID（不填则分析总分）' })
  @IsString()
  @IsOptional()
  subjectId?: string;

  @ApiPropertyOptional({ description: '班级ID' })
  @IsString()
  @IsOptional()
  classId?: string;
}

export class ProgressAnalysisDto {
  @ApiProperty({ description: '当前考试ID' })
  @IsString()
  @IsNotEmpty()
  currentExamId: string;

  @ApiProperty({ description: '对比考试ID' })
  @IsString()
  @IsNotEmpty()
  previousExamId: string;

  @ApiPropertyOptional({ description: '班级ID' })
  @IsString()
  @IsOptional()
  classId?: string;
}

export class CriticalStudentDto {
  @ApiProperty({ description: '考试ID' })
  @IsString()
  @IsNotEmpty()
  examId: string;

  @ApiPropertyOptional({ description: '线位类型' })
  @IsString()
  @IsOptional()
  lineType?: string;

  @ApiPropertyOptional({ description: '浮动分数范围' })
  @IsNumber()
  @IsOptional()
  range?: number;
}

export class SubjectBalanceDto {
  @ApiProperty({ description: '考试ID' })
  @IsString()
  @IsNotEmpty()
  examId: string;

  @ApiPropertyOptional({ description: '学生ID（不填则分析全班）' })
  @IsString()
  @IsOptional()
  studentId?: string;

  @ApiPropertyOptional({ description: '班级ID' })
  @IsString()
  @IsOptional()
  classId?: string;

  @ApiPropertyOptional({ description: '偏科阈值（排名差异百分比）' })
  @IsNumber()
  @IsOptional()
  threshold?: number;
}
