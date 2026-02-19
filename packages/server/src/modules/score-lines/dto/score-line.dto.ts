import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ScoreLineType {
  ONE_BOOK = 'ONE_BOOK',
  REGULAR = 'REGULAR',
  CUSTOM = 'CUSTOM',
}

export class CreateScoreLineDto {
  @ApiProperty({ example: '一本线', description: '线位名称' })
  @IsString()
  @IsNotEmpty({ message: '线位名称不能为空' })
  name: string;

  @ApiProperty({ enum: ScoreLineType, description: '线位类型' })
  @IsEnum(ScoreLineType, { message: '无效的线位类型' })
  type: ScoreLineType;

  @ApiProperty({ example: 'grade_id', description: '年级ID' })
  @IsString()
  @IsNotEmpty({ message: '年级ID不能为空' })
  gradeId: string;

  @ApiProperty({ example: 500, description: '分数线值' })
  @IsNumber()
  scoreValue: number;

  @ApiPropertyOptional({ example: '描述信息', description: '描述' })
  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdateScoreLineDto {
  @ApiPropertyOptional({ example: '一本线', description: '线位名称' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ enum: ScoreLineType, description: '线位类型' })
  @IsEnum(ScoreLineType)
  @IsOptional()
  type?: ScoreLineType;

  @ApiPropertyOptional({ example: 500, description: '分数线值' })
  @IsNumber()
  @IsOptional()
  scoreValue?: number;

  @ApiPropertyOptional({ example: '描述信息', description: '描述' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: true, description: '是否启用' })
  @IsOptional()
  isActive?: boolean;
}

export class QueryScoreLineDto {
  @ApiPropertyOptional({ example: 'grade_id', description: '年级ID' })
  @IsString()
  @IsOptional()
  gradeId?: string;

  @ApiPropertyOptional({ enum: ScoreLineType, description: '线位类型' })
  @IsEnum(ScoreLineType)
  @IsOptional()
  type?: ScoreLineType;

  @ApiPropertyOptional({ example: true, description: '是否启用' })
  @IsOptional()
  isActive?: boolean;
}
