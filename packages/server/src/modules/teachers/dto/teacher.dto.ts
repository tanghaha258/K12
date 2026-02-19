import { IsString, IsNotEmpty, IsOptional, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTeacherDto {
  @ApiProperty({ example: 'T001', description: '工号' })
  @IsString()
  @IsNotEmpty({ message: '工号不能为空' })
  teacherNo: string;

  @ApiProperty({ example: '张老师', description: '姓名' })
  @IsString()
  @IsNotEmpty({ message: '姓名不能为空' })
  name: string;
}

export class UpdateTeacherDto {
  @ApiPropertyOptional({ example: '张老师', description: '姓名' })
  @IsString()
  @IsOptional()
  name?: string;
}

export class AssignClassDto {
  @ApiProperty({ example: 'class_id', description: '班级ID' })
  @IsString()
  @IsNotEmpty()
  classId: string;

  @ApiProperty({ example: 'subject_id', description: '科目ID' })
  @IsString()
  @IsNotEmpty()
  subjectId: string;
}

export class QueryTeacherDto {
  @ApiPropertyOptional({ example: '搜索关键词', description: '搜索关键词' })
  @IsString()
  @IsOptional()
  search?: string;
}
