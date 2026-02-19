import { IsString, IsNotEmpty, IsOptional, IsInt, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateStudentDto {
  @ApiProperty({ example: '2024001', description: '学号' })
  @IsString()
  @IsNotEmpty({ message: '学号不能为空' })
  studentNo: string;

  @ApiProperty({ example: '张三', description: '姓名' })
  @IsString()
  @IsNotEmpty({ message: '姓名不能为空' })
  name: string;

  @ApiProperty({ example: '男', description: '性别', enum: ['男', '女'] })
  @IsIn(['男', '女'], { message: '性别只能是男或女' })
  gender: string;

  @ApiPropertyOptional({ example: '110101200001011234', description: '身份证号' })
  @IsString()
  @IsOptional()
  idCard?: string;

  @ApiProperty({ example: 2024, description: '入学年份' })
  @IsInt()
  entryYear: number;

  @ApiProperty({ example: 'grade_id', description: '年级ID' })
  @IsString()
  @IsNotEmpty()
  gradeId: string;

  @ApiProperty({ example: 'class_id', description: '班级ID' })
  @IsString()
  @IsNotEmpty()
  classId: string;

  @ApiPropertyOptional({ example: 'A01', description: '座位号' })
  @IsString()
  @IsOptional()
  seatNo?: string;

  @ApiPropertyOptional({ example: 'room_id', description: '宿舍房间ID' })
  @IsString()
  @IsOptional()
  dormRoomId?: string;

  @ApiPropertyOptional({ example: 'bed_id', description: '床位ID' })
  @IsString()
  @IsOptional()
  dormBedId?: string;

  @ApiPropertyOptional({ example: '毓秀楼', description: '宿舍楼栋名称' })
  @IsString()
  @IsOptional()
  dormBuilding?: string;

  @ApiPropertyOptional({ example: '401', description: '宿舍房间号' })
  @IsString()
  @IsOptional()
  dormRoom?: string;

  @ApiPropertyOptional({ example: '2', description: '床位号' })
  @IsString()
  @IsOptional()
  dormBed?: string;

  @ApiPropertyOptional({ example: 'day', description: '住宿类型', enum: ['day', 'boarding'] })
  @IsIn(['day', 'boarding'])
  @IsOptional()
  boardingType?: string;
}

export class UpdateStudentDto {
  @ApiPropertyOptional({ example: '2024001', description: '学号' })
  @IsString()
  @IsOptional()
  studentNo?: string;

  @ApiPropertyOptional({ example: '张三', description: '姓名' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: '男', description: '性别', enum: ['男', '女'] })
  @IsIn(['男', '女'])
  @IsOptional()
  gender?: string;

  @ApiPropertyOptional({ example: '110101200001011234', description: '身份证号' })
  @IsString()
  @IsOptional()
  idCard?: string;

  @ApiPropertyOptional({ example: 2024, description: '入学年份' })
  @IsInt()
  @IsOptional()
  entryYear?: number;

  @ApiPropertyOptional({ example: 'class_id', description: '班级ID' })
  @IsString()
  @IsOptional()
  classId?: string;

  @ApiPropertyOptional({ example: 'A01', description: '座位号' })
  @IsString()
  @IsOptional()
  seatNo?: string;

  @ApiPropertyOptional({ example: 'room_id', description: '宿舍房间ID' })
  @IsString()
  @IsOptional()
  dormRoomId?: string;

  @ApiPropertyOptional({ example: 'bed_id', description: '床位ID' })
  @IsString()
  @IsOptional()
  dormBedId?: string;

  @ApiPropertyOptional({ example: '毓秀楼', description: '宿舍楼栋名称' })
  @IsString()
  @IsOptional()
  dormBuilding?: string;

  @ApiPropertyOptional({ example: '401', description: '宿舍房间号' })
  @IsString()
  @IsOptional()
  dormRoom?: string;

  @ApiPropertyOptional({ example: '2', description: '床位号' })
  @IsString()
  @IsOptional()
  dormBed?: string;

  @ApiPropertyOptional({ example: 'boarding', description: '住宿类型', enum: ['day', 'boarding'] })
  @IsIn(['day', 'boarding'])
  @IsOptional()
  boardingType?: string;
}

export class QueryStudentDto {
  @ApiPropertyOptional({ example: 'grade_id', description: '年级ID' })
  @IsString()
  @IsOptional()
  gradeId?: string;

  @ApiPropertyOptional({ example: 'class_id', description: '班级ID' })
  @IsString()
  @IsOptional()
  classId?: string;

  @ApiPropertyOptional({ example: '搜索关键词', description: '搜索关键词' })
  @IsString()
  @IsOptional()
  search?: string;
}
