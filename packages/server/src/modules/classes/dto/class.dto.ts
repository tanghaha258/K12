import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateClassDto {
  @ApiProperty({ example: '高一(1)班', description: '班级名称' })
  @IsString()
  @IsNotEmpty({ message: '班级名称不能为空' })
  name: string;

  @ApiProperty({ example: 'grade_id', description: '年级ID' })
  @IsString()
  @IsNotEmpty({ message: '年级ID不能为空' })
  gradeId: string;
}

export class UpdateClassDto {
  @ApiPropertyOptional({ example: '高一(1)班', description: '班级名称' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'teacher_id', description: '班主任ID' })
  @IsString()
  @IsOptional()
  headTeacherId?: string;
}

export class AssignTeachersDto {
  @ApiProperty({ description: '科任老师列表', type: Array })
  @IsArray()
  teacherIds: string[];

  @ApiProperty({ description: '科目ID' })
  @IsString()
  subjectId: string;
}

export class QueryClassDto {
  @ApiPropertyOptional({ example: 'grade_id', description: '年级ID' })
  @IsString()
  @IsOptional()
  gradeId?: string;
}
