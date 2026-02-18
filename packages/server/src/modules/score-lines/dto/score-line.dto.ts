import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsBoolean, IsEnum, Min, Max } from 'class-validator';

export enum ScoreLineType {
  ONE_BOOK = 'ONE_BOOK',
  REGULAR = 'REGULAR',
  CUSTOM = 'CUSTOM',
}

export class CreateScoreLineDto {
  @ApiProperty({ description: '线位名称' })
  @IsString()
  name: string;

  @ApiProperty({ description: '线位类型', enum: ScoreLineType })
  @IsEnum(ScoreLineType)
  type: ScoreLineType;

  @ApiProperty({ description: '年级ID' })
  @IsString()
  gradeId: string;

  @ApiProperty({ description: '分数线�? })
  @IsNumber()
  @Min(0)
  @Max(750)
  scoreValue: number;

  @ApiPropertyOptional({ description: '描述说明' })
  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdateScoreLineDto {
  @ApiPropertyOptional({ description: '线位名称' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: '线位类型', enum: ScoreLineType })
  @IsEnum(ScoreLineType)
  @IsOptional()
  type?: ScoreLineType;

  @ApiPropertyOptional({ description: '分数线�? })
  @IsNumber()
  @Min(0)
  @Max(750)
  @IsOptional()
  scoreValue?: number;

  @ApiPropertyOptional({ description: '描述说明' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: '是否启用' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class QueryScoreLineDto {
  @ApiPropertyOptional({ description: '年级ID' })
  @IsString()
  @IsOptional()
  gradeId?: string;

  @ApiPropertyOptional({ description: '线位类型', enum: ScoreLineType })
  @IsEnum(ScoreLineType)
  @IsOptional()
  type?: ScoreLineType;

  @ApiPropertyOptional({ description: '是否只查启用状�? })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
