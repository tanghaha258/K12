import { IsString, IsNotEmpty, IsOptional, IsInt } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateGradeDto {
  @ApiProperty({ example: '2024级高一', description: '年级名称' })
  @IsString()
  @IsNotEmpty({ message: '年级名称不能为空' })
  name: string;

  @ApiProperty({ example: 2024, description: '入学年份' })
  @IsInt()
  entryYear: number;
}

export class UpdateGradeDto {
  @ApiPropertyOptional({ example: '2024级高一', description: '年级名称' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 2024, description: '入学年份' })
  @IsInt()
  @IsOptional()
  entryYear?: number;

  @ApiPropertyOptional({ example: 'active', description: '年级状态' })
  @IsString()
  @IsOptional()
  status?: string;
}

export class QueryGradeDto {
  @ApiPropertyOptional({ example: 'active', description: '年级状态' })
  @IsString()
  @IsOptional()
  status?: string;
}
