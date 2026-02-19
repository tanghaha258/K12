import { IsString, IsNotEmpty, IsOptional, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const PHONE_REGEX = /^1[3-9]\d{9}$/;
const PHONE_MESSAGE = '请输入正确的手机号（11位数字，以1开头）';

export class CreateTeacherDto {
  @ApiProperty({ example: 'T001', description: '工号' })
  @IsString()
  @IsNotEmpty({ message: '工号不能为空' })
  teacherNo: string;

  @ApiProperty({ example: '张老师', description: '姓名' })
  @IsString()
  @IsNotEmpty({ message: '姓名不能为空' })
  name: string;

  @ApiPropertyOptional({ example: '13800138000', description: '手机号' })
  @IsString()
  @IsOptional()
  @Matches(PHONE_REGEX, { message: PHONE_MESSAGE })
  phone?: string;
}

export class UpdateTeacherDto {
  @ApiPropertyOptional({ example: '张老师', description: '姓名' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: '13800138000', description: '手机号' })
  @IsString()
  @IsOptional()
  @Matches(PHONE_REGEX, { message: PHONE_MESSAGE })
  phone?: string;
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
