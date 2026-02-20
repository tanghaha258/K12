import { IsString, IsNumber, IsOptional, IsBoolean, IsEnum, Min, Max, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

// 德育分类枚举
export enum MoralCategory {
  BEHAVIOR = 'behavior',    // 行为规范
  HYGIENE = 'hygiene',      // 卫生纪律
  STUDY = 'study',          // 学习表现
  ACTIVITY = 'activity',    // 活动参与
  OTHER = 'other',          // 其他
}

// 事件来源枚举
export enum MoralSource {
  TEACHER = 'teacher',      // 教师录入
  SYSTEM = 'system',        // 系统导入
  IMPORT = 'import',        // 批量导入
}

// 事件状态枚举
export enum MoralStatus {
  EFFECTIVE = 'effective',  // 有效
  CANCELLED = 'cancelled',  // 已撤销
}

// 创建规则DTO
export class CreateMoralRuleDto {
  @ApiProperty({ description: '规则名称' })
  @IsString()
  name: string;

  @ApiProperty({ description: '分类', enum: MoralCategory })
  @IsEnum(MoralCategory)
  category: MoralCategory;

  @ApiProperty({ description: '分值（正数为加分，负数为扣分）' })
  @IsNumber()
  @Type(() => Number)
  score: number;

  @ApiPropertyOptional({ description: '规则说明' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: '适用年级ID，null表示全校通用' })
  @IsString()
  @IsOptional()
  gradeId?: string;

  @ApiPropertyOptional({ description: '是否启用', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

// 更新规则DTO
export class UpdateMoralRuleDto {
  @ApiPropertyOptional({ description: '规则名称' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: '分类', enum: MoralCategory })
  @IsEnum(MoralCategory)
  @IsOptional()
  category?: MoralCategory;

  @ApiPropertyOptional({ description: '分值（正数为加分，负数为扣分）' })
  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  score?: number;

  @ApiPropertyOptional({ description: '规则说明' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: '适用年级ID，null表示全校通用' })
  @IsString()
  @IsOptional()
  gradeId?: string;

  @ApiPropertyOptional({ description: '是否启用' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

// 查询规则DTO
export class QueryMoralRuleDto {
  @ApiPropertyOptional({ description: '分类' })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({ description: '年级ID' })
  @IsString()
  @IsOptional()
  gradeId?: string;

  @ApiPropertyOptional({ description: '是否启用' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ description: '搜索关键词' })
  @IsString()
  @IsOptional()
  keyword?: string;

  @ApiPropertyOptional({ description: '页码', default: 1 })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ description: '每页数量', default: 20 })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  pageSize?: number;
}

// 创建事件DTO
export class CreateMoralEventDto {
  @ApiProperty({ description: '学生ID' })
  @IsString()
  studentId: string;

  @ApiPropertyOptional({ description: '规则ID' })
  @IsString()
  @IsOptional()
  ruleId?: string;

  @ApiProperty({ description: '分类', enum: MoralCategory })
  @IsEnum(MoralCategory)
  category: MoralCategory;

  @ApiProperty({ description: '事项名称' })
  @IsString()
  itemName: string;

  @ApiProperty({ description: '分值变化（正数为加分，负数为扣分）' })
  @IsNumber()
  @Type(() => Number)
  scoreDelta: number;

  @ApiPropertyOptional({ description: '备注说明' })
  @IsString()
  @IsOptional()
  note?: string;

  @ApiPropertyOptional({ description: '图片证据URL数组' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];

  @ApiPropertyOptional({ description: '发生时间' })
  @IsString()
  @IsOptional()
  occurredAt?: string;
}

// 批量创建事件DTO
export class BatchCreateMoralEventDto {
  @ApiProperty({ description: '学生ID列表', type: [String] })
  @IsArray()
  @IsString({ each: true })
  studentIds: string[];

  @ApiPropertyOptional({ description: '规则ID' })
  @IsString()
  @IsOptional()
  ruleId?: string;

  @ApiProperty({ description: '分类', enum: MoralCategory })
  @IsEnum(MoralCategory)
  category: MoralCategory;

  @ApiProperty({ description: '事项名称' })
  @IsString()
  itemName: string;

  @ApiProperty({ description: '分值变化（正数为加分，负数为扣分）' })
  @IsNumber()
  @Type(() => Number)
  scoreDelta: number;

  @ApiPropertyOptional({ description: '备注说明' })
  @IsString()
  @IsOptional()
  note?: string;

  @ApiPropertyOptional({ description: '发生时间' })
  @IsString()
  @IsOptional()
  occurredAt?: string;
}

// 撤销事件DTO
export class CancelMoralEventDto {
  @ApiProperty({ description: '撤销原因' })
  @IsString()
  cancelReason: string;
}

// 查询事件DTO
export class QueryMoralEventDto {
  @ApiPropertyOptional({ description: '学生ID' })
  @IsString()
  @IsOptional()
  studentId?: string;

  @ApiPropertyOptional({ description: '班级ID' })
  @IsString()
  @IsOptional()
  classId?: string;

  @ApiPropertyOptional({ description: '年级ID' })
  @IsString()
  @IsOptional()
  gradeId?: string;

  @ApiPropertyOptional({ description: '分类' })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({ description: '状态' })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ description: '开始日期' })
  @IsString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ description: '结束日期' })
  @IsString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ description: '页码', default: 1 })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ description: '每页数量', default: 20 })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  pageSize?: number;
}

// 学生德育统计查询DTO
export class QueryMoralStatsDto {
  @ApiPropertyOptional({ description: '年级ID' })
  @IsString()
  @IsOptional()
  gradeId?: string;

  @ApiPropertyOptional({ description: '班级ID' })
  @IsString()
  @IsOptional()
  classId?: string;

  @ApiPropertyOptional({ description: '学生ID' })
  @IsString()
  @IsOptional()
  studentId?: string;

  @ApiPropertyOptional({ description: '开始日期' })
  @IsString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ description: '结束日期' })
  @IsString()
  @IsOptional()
  endDate?: string;
}

// 导入事件DTO
export class ImportMoralEventDto {
  @ApiProperty({ description: '学号' })
  @IsString()
  studentNo: string;

  @ApiProperty({ description: '分类' })
  @IsString()
  category: string;

  @ApiProperty({ description: '事项名称' })
  @IsString()
  itemName: string;

  @ApiProperty({ description: '分值变化（正数为加分，负数为扣分）' })
  @IsNumber()
  @Type(() => Number)
  scoreDelta: number;

  @ApiPropertyOptional({ description: '备注说明' })
  @IsString()
  @IsOptional()
  note?: string;

  @ApiPropertyOptional({ description: '发生日期 (YYYY-MM-DD)' })
  @IsString()
  @IsOptional()
  occurredAt?: string;
}

// 导入结果DTO
export class ImportMoralResultDto {
  @ApiProperty({ description: '成功数量' })
  success: number;

  @ApiProperty({ description: '失败数量' })
  failed: number;

  @ApiProperty({ description: '错误详情', type: 'array' })
  errors: Array<{
    row: number;
    studentNo: string;
    message: string;
  }>;
}

// 宿舍德育查询DTO
export class QueryDormMoralDto {
  @ApiPropertyOptional({ description: '宿舍楼ID' })
  @IsString()
  @IsOptional()
  buildingId?: string;

  @ApiPropertyOptional({ description: '房间ID' })
  @IsString()
  @IsOptional()
  roomId?: string;

  @ApiPropertyOptional({ description: '分类' })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({ description: '开始日期' })
  @IsString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ description: '结束日期' })
  @IsString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ description: '页码', default: 1 })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ description: '每页数量', default: 20 })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  pageSize?: number;
}
