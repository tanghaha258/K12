import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsBoolean, Min, Max } from 'class-validator';

export class CreateScoreSegmentDto {
  @ApiProperty({ description: '规则名称' })
  @IsString()
  name: string;

  @ApiProperty({ description: '年级ID' })
  @IsString()
  gradeId: string;

  @ApiPropertyOptional({ description: '科目ID（可选，为空则适用于所有科目）' })
  @IsString()
  @IsOptional()
  subjectId?: string;

  @ApiProperty({ description: '优秀分数线（默认90�?, default: 90 })
  @IsNumber()
  @Min(0)
  @Max(100)
  excellentMin: number = 90;

  @ApiProperty({ description: '良好分数线（默认80�?, default: 80 })
  @IsNumber()
  @Min(0)
  @Max(100)
  goodMin: number = 80;

  @ApiProperty({ description: '及格分数线（默认60�?, default: 60 })
  @IsNumber()
  @Min(0)
  @Max(100)
  passMin: number = 60;

  @ApiProperty({ description: '低分分数线（默认59�?, default: 59 })
  @IsNumber()
  @Min(0)
  @Max(100)
  failMax: number = 59;

  @ApiPropertyOptional({ description: '是否为默认规�?, default: false })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}

export class UpdateScoreSegmentDto {
  @ApiPropertyOptional({ description: '规则名称' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: '优秀分数�? })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  excellentMin?: number;

  @ApiPropertyOptional({ description: '良好分数�? })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  goodMin?: number;

  @ApiPropertyOptional({ description: '及格分数�? })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  passMin?: number;

  @ApiPropertyOptional({ description: '低分分数�? })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  failMax?: number;

  @ApiPropertyOptional({ description: '是否为默认规�? })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @ApiPropertyOptional({ description: '是否启用' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class QueryScoreSegmentDto {
  @ApiPropertyOptional({ description: '年级ID' })
  @IsString()
  @IsOptional()
  gradeId?: string;

  @ApiPropertyOptional({ description: '科目ID' })
  @IsString()
  @IsOptional()
  subjectId?: string;

  @ApiPropertyOptional({ description: '是否只查启用状�? })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
