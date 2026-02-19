import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateScoreSegmentDto {
  @ApiProperty({ example: '默认分段', description: '规则名称' })
  @IsString()
  @IsNotEmpty({ message: '规则名称不能为空' })
  name: string;

  @ApiProperty({ example: 'grade_id', description: '年级ID' })
  @IsString()
  @IsNotEmpty({ message: '年级ID不能为空' })
  gradeId: string;

  @ApiPropertyOptional({ example: 'subject_id', description: '科目ID（为空则适用所有科目）' })
  @IsString()
  @IsOptional()
  subjectId?: string;

  @ApiProperty({ example: 90, description: '优秀分数线' })
  @IsNumber()
  excellentMin: number;

  @ApiProperty({ example: 80, description: '良好分数线' })
  @IsNumber()
  goodMin: number;

  @ApiProperty({ example: 60, description: '及格分数线' })
  @IsNumber()
  passMin: number;

  @ApiProperty({ example: 59, description: '低分分数线' })
  @IsNumber()
  failMax: number;

  @ApiPropertyOptional({ example: false, description: '是否为默认规则' })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}

export class UpdateScoreSegmentDto {
  @ApiPropertyOptional({ example: '默认分段', description: '规则名称' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 90, description: '优秀分数线' })
  @IsNumber()
  @IsOptional()
  excellentMin?: number;

  @ApiPropertyOptional({ example: 80, description: '良好分数线' })
  @IsNumber()
  @IsOptional()
  goodMin?: number;

  @ApiPropertyOptional({ example: 60, description: '及格分数线' })
  @IsNumber()
  @IsOptional()
  passMin?: number;

  @ApiPropertyOptional({ example: 59, description: '低分分数线' })
  @IsNumber()
  @IsOptional()
  failMax?: number;

  @ApiPropertyOptional({ example: false, description: '是否为默认规则' })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @ApiPropertyOptional({ example: true, description: '是否启用' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class QueryScoreSegmentDto {
  @ApiPropertyOptional({ example: 'grade_id', description: '年级ID' })
  @IsString()
  @IsOptional()
  gradeId?: string;

  @ApiPropertyOptional({ example: 'subject_id', description: '科目ID' })
  @IsString()
  @IsOptional()
  subjectId?: string;

  @ApiPropertyOptional({ example: true, description: '是否启用' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
