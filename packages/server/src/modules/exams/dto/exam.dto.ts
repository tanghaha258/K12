import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean, IsArray, ValidateNested, IsDateString, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class ExamSubjectDto {
  @ApiProperty({ description: '科目ID' })
  @IsString()
  @IsNotEmpty()
  subjectId: string;

  @ApiProperty({ description: '满分', example: 100 })
  @IsNumber()
  maxScore: number;

  @ApiPropertyOptional({ description: '优秀线', example: 90 })
  @IsNumber()
  @IsOptional()
  excellentLine?: number;

  @ApiPropertyOptional({ description: '及格线', example: 60 })
  @IsNumber()
  @IsOptional()
  passLine?: number;

  @ApiPropertyOptional({ description: '低分线', example: 30 })
  @IsNumber()
  @IsOptional()
  lowLine?: number;

  @ApiPropertyOptional({ description: '权重', example: 1 })
  @IsNumber()
  @IsOptional()
  weight?: number;

  @ApiPropertyOptional({ description: '是否参与总分统计', example: true })
  @IsBoolean()
  @IsOptional()
  includeInTotal?: boolean;

  @ApiPropertyOptional({ description: '是否参与排名', example: true })
  @IsBoolean()
  @IsOptional()
  includeInRank?: boolean;
}

export class CreateExamDto {
  @ApiProperty({ description: '考试名称', example: '2024-2025学年第一学期期中考试' })
  @IsString()
  @IsNotEmpty({ message: '考试名称不能为空' })
  name: string;

  @ApiProperty({ description: '考试类型', example: 'midterm', enum: ['monthly', 'midterm', 'final', 'mock', 'weekly', 'unit'] })
  @IsString()
  @IsNotEmpty()
  @IsIn(['monthly', 'midterm', 'final', 'mock', 'weekly', 'unit'])
  type: string;

  @ApiProperty({ description: '学期', example: '2024-2025-1' })
  @IsString()
  @IsNotEmpty()
  term: string;

  @ApiProperty({ description: '学年', example: '2024-2025' })
  @IsString()
  @IsNotEmpty()
  schoolYear: string;

  @ApiProperty({ description: '年级ID' })
  @IsString()
  @IsNotEmpty()
  gradeId: string;

  @ApiPropertyOptional({ description: '考试开始时间', example: '2024-11-10T08:00:00Z' })
  @IsDateString()
  @IsOptional()
  startTime?: string;

  @ApiPropertyOptional({ description: '考试结束时间', example: '2024-11-12T17:00:00Z' })
  @IsDateString()
  @IsOptional()
  endTime?: string;

  @ApiPropertyOptional({ description: '考试科目列表', type: [ExamSubjectDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExamSubjectDto)
  @IsOptional()
  subjects?: ExamSubjectDto[];
}

export class UpdateExamDto {
  @ApiPropertyOptional({ description: '考试名称' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: '考试类型' })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiPropertyOptional({ description: '学期' })
  @IsString()
  @IsOptional()
  term?: string;

  @ApiPropertyOptional({ description: '学年' })
  @IsString()
  @IsOptional()
  schoolYear?: string;

  @ApiPropertyOptional({ description: '考试开始时间' })
  @IsDateString()
  @IsOptional()
  startTime?: string;

  @ApiPropertyOptional({ description: '考试结束时间' })
  @IsDateString()
  @IsOptional()
  endTime?: string;

  @ApiPropertyOptional({ description: '状态' })
  @IsString()
  @IsOptional()
  status?: string;
}

export class QueryExamDto {
  @ApiPropertyOptional({ description: '年级ID' })
  @IsString()
  @IsOptional()
  gradeId?: string;

  @ApiPropertyOptional({ description: '考试类型' })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiPropertyOptional({ description: '学年' })
  @IsString()
  @IsOptional()
  schoolYear?: string;

  @ApiPropertyOptional({ description: '学期' })
  @IsString()
  @IsOptional()
  term?: string;

  @ApiPropertyOptional({ description: '状态' })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ description: '搜索关键词' })
  @IsString()
  @IsOptional()
  search?: string;
}

export class AddExamSubjectDto {
  @ApiProperty({ description: '科目ID' })
  @IsString()
  @IsNotEmpty()
  subjectId: string;

  @ApiProperty({ description: '满分' })
  @IsNumber()
  maxScore: number;

  @ApiPropertyOptional({ description: '优秀线' })
  @IsNumber()
  @IsOptional()
  excellentLine?: number;

  @ApiPropertyOptional({ description: '及格线' })
  @IsNumber()
  @IsOptional()
  passLine?: number;

  @ApiPropertyOptional({ description: '低分线' })
  @IsNumber()
  @IsOptional()
  lowLine?: number;

  @ApiPropertyOptional({ description: '权重' })
  @IsNumber()
  @IsOptional()
  weight?: number;

  @ApiPropertyOptional({ description: '是否参与总分统计' })
  @IsBoolean()
  @IsOptional()
  includeInTotal?: boolean;

  @ApiPropertyOptional({ description: '是否参与排名' })
  @IsBoolean()
  @IsOptional()
  includeInRank?: boolean;
}

export class UpdateExamSubjectDto {
  @ApiPropertyOptional({ description: '满分' })
  @IsNumber()
  @IsOptional()
  maxScore?: number;

  @ApiPropertyOptional({ description: '优秀线' })
  @IsNumber()
  @IsOptional()
  excellentLine?: number;

  @ApiPropertyOptional({ description: '及格线' })
  @IsNumber()
  @IsOptional()
  passLine?: number;

  @ApiPropertyOptional({ description: '低分线' })
  @IsNumber()
  @IsOptional()
  lowLine?: number;

  @ApiPropertyOptional({ description: '权重' })
  @IsNumber()
  @IsOptional()
  weight?: number;

  @ApiPropertyOptional({ description: '是否参与总分统计' })
  @IsBoolean()
  @IsOptional()
  includeInTotal?: boolean;

  @ApiPropertyOptional({ description: '是否参与排名' })
  @IsBoolean()
  @IsOptional()
  includeInRank?: boolean;
}
