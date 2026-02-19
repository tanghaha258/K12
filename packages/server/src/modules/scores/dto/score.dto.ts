import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateScoreDto {
  @ApiProperty({ description: '学生ID' })
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @ApiProperty({ description: '考试ID' })
  @IsString()
  @IsNotEmpty()
  examId: string;

  @ApiProperty({ description: '科目ID' })
  @IsString()
  @IsNotEmpty()
  subjectId: string;

  @ApiProperty({ description: '原始分数' })
  @IsNumber()
  rawScore: number;

  @ApiPropertyOptional({ description: '赋分' })
  @IsNumber()
  @IsOptional()
  assignedScore?: number;

  @ApiPropertyOptional({ description: '是否缺考' })
  @IsBoolean()
  @IsOptional()
  isAbsent?: boolean;
}

export class BatchScoreDto {
  @ApiProperty({ description: '考试ID' })
  @IsString()
  @IsNotEmpty()
  examId: string;

  @ApiProperty({ description: '科目ID' })
  @IsString()
  @IsNotEmpty()
  subjectId: string;

  @ApiProperty({ description: '成绩列表', type: 'array' })
  @IsArray()
  scores: {
    studentId: string;
    rawScore: number;
    isAbsent?: boolean;
  }[];
}

export class QueryScoreDto {
  @ApiPropertyOptional({ description: '考试ID' })
  @IsString()
  @IsOptional()
  examId?: string;

  @ApiPropertyOptional({ description: '学生ID' })
  @IsString()
  @IsOptional()
  studentId?: string;

  @ApiPropertyOptional({ description: '科目ID' })
  @IsString()
  @IsOptional()
  subjectId?: string;

  @ApiPropertyOptional({ description: '班级ID' })
  @IsString()
  @IsOptional()
  classId?: string;

  @ApiPropertyOptional({ description: '年级ID' })
  @IsString()
  @IsOptional()
  gradeId?: string;
}

export class UpdateScoreDto {
  @ApiPropertyOptional({ description: '原始分数' })
  @IsNumber()
  @IsOptional()
  rawScore?: number;

  @ApiPropertyOptional({ description: '赋分' })
  @IsNumber()
  @IsOptional()
  assignedScore?: number;

  @ApiPropertyOptional({ description: '是否缺考' })
  @IsBoolean()
  @IsOptional()
  isAbsent?: boolean;
}

export class ScoreAnalysisDto {
  @ApiProperty({ description: '考试ID' })
  @IsString()
  @IsNotEmpty()
  examId: string;

  @ApiPropertyOptional({ description: '科目ID' })
  @IsString()
  @IsOptional()
  subjectId?: string;

  @ApiPropertyOptional({ description: '班级ID' })
  @IsString()
  @IsOptional()
  classId?: string;
}

export class ExcelImportRowDto {
  @ApiProperty({ description: '学号' })
  studentNo: string;

  @ApiProperty({ description: '学生姓名' })
  studentName: string;

  @ApiProperty({ description: '各科成绩', type: 'object' })
  scores: Record<string, number>;

  @ApiPropertyOptional({ description: '是否缺考' })
  isAbsent?: boolean;
}

export class ExcelImportDto {
  @ApiProperty({ description: '成绩数据', type: [ExcelImportRowDto] })
  @IsArray()
  data: ExcelImportRowDto[];
}
