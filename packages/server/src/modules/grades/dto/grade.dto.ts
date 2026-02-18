import { IsString, IsNotEmpty, IsInt, IsOptional, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateGradeDto {
  @ApiProperty({ example: '2024�?, description: '年级名称' })
  @IsString()
  @IsNotEmpty({ message: '年级名称不能为空' })
  name: string;

  @ApiProperty({ example: 2024, description: '入学年份' })
  @IsInt({ message: '入学年份必须是整�? })
  @IsNotEmpty({ message: '入学年份不能为空' })
  entryYear: number;
}

export class UpdateGradeDto {
  @ApiPropertyOptional({ example: '2024�?, description: '年级名称' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 2024, description: '入学年份' })
  @IsInt()
  @IsOptional()
  entryYear?: number;

  @ApiPropertyOptional({ example: 'active', description: '状�?, enum: ['active', 'graduated', 'archived'] })
  @IsString()
  @IsIn(['active', 'graduated', 'archived'])
  @IsOptional()
  status?: string;
}

export class QueryGradeDto {
  @ApiPropertyOptional({ example: 'active', description: '状态筛�? })
  @IsString()
  @IsOptional()
  status?: string;
}
