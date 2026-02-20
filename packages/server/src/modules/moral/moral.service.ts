import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  CreateMoralRuleDto,
  UpdateMoralRuleDto,
  QueryMoralRuleDto,
  CreateMoralEventDto,
  BatchCreateMoralEventDto,
  CancelMoralEventDto,
  QueryMoralEventDto,
  QueryMoralStatsDto,
  ImportMoralEventDto,
  QueryDormMoralDto,
  MoralSource,
  MoralStatus,
} from './dto/moral.dto';
import { v4 as uuidv4 } from 'uuid';
import * as XLSX from 'xlsx';

@Injectable()
export class MoralService {
  constructor(private readonly prisma: PrismaService) {}

  // ========== 德育规则管理 ==========

  // 创建规则
  async createRule(createDto: CreateMoralRuleDto) {
    const rule = await this.prisma.moral_rules.create({
      data: {
        id: uuidv4(),
        ...createDto,
      },
      include: {
        grades: true,
      },
    });
    return rule;
  }

  // 获取规则列表
  async findAllRules(query: QueryMoralRuleDto) {
    const { category, gradeId, isActive, keyword, page = 1, pageSize = 20 } = query;

    const where: any = {};
    if (category) where.category = category;
    if (gradeId !== undefined) where.gradeId = gradeId || null;
    if (isActive !== undefined) where.isActive = isActive;
    if (keyword) {
      where.OR = [
        { name: { contains: keyword } },
        { description: { contains: keyword } },
      ];
    }

    const [list, total] = await Promise.all([
      this.prisma.moral_rules.findMany({
        where,
        include: {
          grades: true,
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.moral_rules.count({ where }),
    ]);

    return {
      list,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  // 获取规则详情
  async findRuleById(id: string) {
    const rule = await this.prisma.moral_rules.findUnique({
      where: { id },
      include: {
        grades: true,
      },
    });

    if (!rule) {
      throw new NotFoundException('规则不存在');
    }

    return rule;
  }

  // 更新规则
  async updateRule(id: string, updateDto: UpdateMoralRuleDto) {
    await this.findRuleById(id);

    const rule = await this.prisma.moral_rules.update({
      where: { id },
      data: updateDto,
      include: {
        grades: true,
      },
    });

    return rule;
  }

  // 删除规则
  async deleteRule(id: string) {
    await this.findRuleById(id);

    // 检查是否有事件引用此规则
    const eventCount = await this.prisma.moral_events.count({
      where: { ruleId: id },
    });

    if (eventCount > 0) {
      throw new BadRequestException('该规则已被使用，无法删除');
    }

    await this.prisma.moral_rules.delete({
      where: { id },
    });

    return { success: true };
  }

  // ========== 德育事件管理 ==========

  // 创建事件
  async createEvent(createDto: CreateMoralEventDto, userId: string) {
    const { studentId, ruleId, occurredAt, ...rest } = createDto;

    // 验证学生是否存在
    const student = await this.prisma.students.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      throw new NotFoundException('学生不存在');
    }

    // 如果指定了规则，验证规则是否存在
    if (ruleId) {
      const rule = await this.prisma.moral_rules.findUnique({
        where: { id: ruleId },
      });

      if (!rule) {
        throw new NotFoundException('规则不存在');
      }
    }

    const event = await this.prisma.moral_events.create({
      data: {
        id: uuidv4(),
        studentId,
        ruleId,
        source: MoralSource.TEACHER,
        createdBy: userId,
        occurredAt: occurredAt ? new Date(occurredAt) : new Date(),
        ...rest,
      },
      include: {
        students: {
          include: {
            users: true,
            classes: true,
            grades: true,
          },
        },
        rules: true,
      },
    });

    return event;
  }

  // 批量创建事件
  async batchCreateEvent(batchDto: BatchCreateMoralEventDto, userId: string) {
    const { studentIds, ruleId, occurredAt, ...rest } = batchDto;

    // 验证所有学生是否存在
    const students = await this.prisma.students.findMany({
      where: { id: { in: studentIds } },
    });

    if (students.length !== studentIds.length) {
      throw new BadRequestException('部分学生不存在');
    }

    // 如果指定了规则，验证规则是否存在
    if (ruleId) {
      const rule = await this.prisma.moral_rules.findUnique({
        where: { id: ruleId },
      });

      if (!rule) {
        throw new NotFoundException('规则不存在');
      }
    }

    const events = await this.prisma.$transaction(
      studentIds.map((studentId) =>
        this.prisma.moral_events.create({
          data: {
            id: uuidv4(),
            studentId,
            ruleId,
            source: MoralSource.TEACHER,
            createdBy: userId,
            occurredAt: occurredAt ? new Date(occurredAt) : new Date(),
            ...rest,
          },
          include: {
            students: {
              include: {
                users: true,
                classes: true,
                grades: true,
              },
            },
            rules: true,
          },
        })
      )
    );

    return {
      success: true,
      count: events.length,
      events,
    };
  }

  // 获取事件列表
  async findAllEvents(query: QueryMoralEventDto) {
    const {
      studentId,
      classId,
      gradeId,
      category,
      status,
      startDate,
      endDate,
      page = 1,
      pageSize = 20,
    } = query;

    const where: any = {};
    if (studentId) where.studentId = studentId;
    if (category) where.category = category;
    if (status) where.status = status;

    // 日期范围查询
    if (startDate || endDate) {
      where.occurredAt = {};
      if (startDate) where.occurredAt.gte = new Date(startDate);
      if (endDate) where.occurredAt.lte = new Date(endDate);
    }

    // 班级和年级查询
    if (classId || gradeId) {
      where.students = {};
      if (classId) where.students.classId = classId;
      if (gradeId) where.students.gradeId = gradeId;
    }

    const [list, total] = await Promise.all([
      this.prisma.moral_events.findMany({
        where,
        include: {
          students: {
            include: {
              users: true,
              classes: true,
              grades: true,
            },
          },
          rules: true,
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { occurredAt: 'desc' },
      }),
      this.prisma.moral_events.count({ where }),
    ]);

    return {
      list,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  // 获取事件详情
  async findEventById(id: string) {
    const event = await this.prisma.moral_events.findUnique({
      where: { id },
      include: {
        students: {
          include: {
            users: true,
            classes: true,
            grades: true,
          },
        },
        rules: true,
      },
    });

    if (!event) {
      throw new NotFoundException('事件不存在');
    }

    return event;
  }

  // 撤销事件
  async cancelEvent(id: string, cancelDto: CancelMoralEventDto, userId: string) {
    const event = await this.findEventById(id);

    if (event.status === MoralStatus.CANCELLED) {
      throw new BadRequestException('该事件已被撤销');
    }

    const updatedEvent = await this.prisma.moral_events.update({
      where: { id },
      data: {
        status: MoralStatus.CANCELLED,
        cancelledBy: userId,
        cancelledAt: new Date(),
        cancelReason: cancelDto.cancelReason,
      },
      include: {
        students: {
          include: {
            users: true,
            classes: true,
            grades: true,
          },
        },
        rules: true,
      },
    });

    return updatedEvent;
  }

  // ========== 德育统计 ==========

  // 获取学生德育统计
  async getStudentStats(query: QueryMoralStatsDto) {
    const { studentId, classId, gradeId, startDate, endDate } = query;

    const where: any = {
      status: MoralStatus.EFFECTIVE,
    };

    // 日期范围
    if (startDate || endDate) {
      where.occurredAt = {};
      if (startDate) where.occurredAt.gte = new Date(startDate);
      if (endDate) where.occurredAt.lte = new Date(endDate);
    }

    // 学生、班级、年级筛选
    if (studentId) {
      where.studentId = studentId;
    } else if (classId || gradeId) {
      where.students = {};
      if (classId) where.students.classId = classId;
      if (gradeId) where.students.gradeId = gradeId;
    }

    // 获取所有有效事件
    const events = await this.prisma.moral_events.findMany({
      where,
      include: {
        students: {
          include: {
            users: true,
            classes: true,
            grades: true,
          },
        },
      },
    });

    // 按学生分组统计
    const studentMap = new Map();

    for (const event of events) {
      const student = event.students;
      if (!studentMap.has(student.id)) {
        studentMap.set(student.id, {
          studentId: student.id,
          studentName: student.users?.name || '',
          studentNo: student.studentNo,
          className: student.classes?.name || '',
          gradeName: student.grades?.name || '',
          totalScore: 0,
          addScore: 0,
          subScore: 0,
          eventCount: 0,
          addCount: 0,
          subCount: 0,
          categories: {},
        });
      }

      const stats = studentMap.get(student.id);
      stats.totalScore += event.scoreDelta;
      stats.eventCount += 1;

      if (event.scoreDelta > 0) {
        stats.addScore += event.scoreDelta;
        stats.addCount += 1;
      } else {
        stats.subScore += event.scoreDelta;
        stats.subCount += 1;
      }

      // 分类统计
      if (!stats.categories[event.category]) {
        stats.categories[event.category] = {
          count: 0,
          score: 0,
        };
      }
      stats.categories[event.category].count += 1;
      stats.categories[event.category].score += event.scoreDelta;
    }

    return Array.from(studentMap.values());
  }

  // 获取班级德育统计
  async getClassStats(query: QueryMoralStatsDto) {
    const { gradeId, startDate, endDate } = query;

    const where: any = {
      status: MoralStatus.EFFECTIVE,
    };

    // 日期范围
    if (startDate || endDate) {
      where.occurredAt = {};
      if (startDate) where.occurredAt.gte = new Date(startDate);
      if (endDate) where.occurredAt.lte = new Date(endDate);
    }

    // 年级筛选
    if (gradeId) {
      where.students = { gradeId };
    }

    // 获取所有有效事件
    const events = await this.prisma.moral_events.findMany({
      where,
      include: {
        students: {
          include: {
            classes: true,
            grades: true,
          },
        },
      },
    });

    // 按班级分组统计
    const classMap = new Map();

    for (const event of events) {
      const student = event.students;
      const classId = student.classId;

      if (!classMap.has(classId)) {
        classMap.set(classId, {
          classId: classId,
          className: student.classes?.name || '',
          gradeName: student.grades?.name || '',
          totalScore: 0,
          addScore: 0,
          subScore: 0,
          eventCount: 0,
          addCount: 0,
          subCount: 0,
          studentCount: new Set(),
        });
      }

      const stats = classMap.get(classId);
      stats.totalScore += event.scoreDelta;
      stats.eventCount += 1;
      stats.studentCount.add(student.id);

      if (event.scoreDelta > 0) {
        stats.addScore += event.scoreDelta;
        stats.addCount += 1;
      } else {
        stats.subScore += event.scoreDelta;
        stats.subCount += 1;
      }
    }

    // 转换学生集合为数量
    return Array.from(classMap.values()).map((stats: any) => ({
      ...stats,
      studentCount: stats.studentCount.size,
      avgScore: stats.studentCount.size > 0
        ? (stats.totalScore / stats.studentCount.size).toFixed(2)
        : 0,
    }));
  }

  // 获取分类统计
  async getCategoryStats(query: QueryMoralStatsDto) {
    const { gradeId, classId, startDate, endDate } = query;

    const where: any = {
      status: MoralStatus.EFFECTIVE,
    };

    // 日期范围
    if (startDate || endDate) {
      where.occurredAt = {};
      if (startDate) where.occurredAt.gte = new Date(startDate);
      if (endDate) where.occurredAt.lte = new Date(endDate);
    }

    // 班级和年级筛选
    if (classId || gradeId) {
      where.students = {};
      if (classId) where.students.classId = classId;
      if (gradeId) where.students.gradeId = gradeId;
    }

    // 获取所有有效事件
    const events = await this.prisma.moral_events.findMany({
      where,
    });

    // 按分类统计
    const categoryMap = new Map();

    for (const event of events) {
      if (!categoryMap.has(event.category)) {
        categoryMap.set(event.category, {
          category: event.category,
          totalScore: 0,
          eventCount: 0,
          addScore: 0,
          subScore: 0,
          addCount: 0,
          subCount: 0,
        });
      }

      const stats = categoryMap.get(event.category);
      stats.totalScore += event.scoreDelta;
      stats.eventCount += 1;

      if (event.scoreDelta > 0) {
        stats.addScore += event.scoreDelta;
        stats.addCount += 1;
      } else {
        stats.subScore += event.scoreDelta;
        stats.subCount += 1;
      }
    }

    return Array.from(categoryMap.values());
  }

  // ========== Excel批量导入 ==========

  // 解析Excel文件
  async parseExcel(file: Buffer): Promise<ImportMoralEventDto[]> {
    const workbook = XLSX.read(file, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

    if (data.length < 2) {
      throw new BadRequestException('Excel文件格式错误，至少需要包含表头和一行数据');
    }

    // 解析表头
    const headers = data[0].map((h: string) => h?.toString().trim());
    const requiredColumns = ['学号', '分类', '事项名称', '分值'];
    
    for (const col of requiredColumns) {
      if (!headers.includes(col)) {
        throw new BadRequestException(`Excel缺少必需列：${col}`);
      }
    }

    const colIndex = {
      studentNo: headers.indexOf('学号'),
      category: headers.indexOf('分类'),
      itemName: headers.indexOf('事项名称'),
      scoreDelta: headers.indexOf('分值'),
      note: headers.indexOf('备注'),
      occurredAt: headers.indexOf('发生日期'),
    };

    // 解析数据行
    const results: ImportMoralEventDto[] = [];
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row[colIndex.studentNo]) continue; // 跳过空行

      results.push({
        studentNo: row[colIndex.studentNo]?.toString().trim(),
        category: this.parseCategory(row[colIndex.category]?.toString().trim()),
        itemName: row[colIndex.itemName]?.toString().trim(),
        scoreDelta: Number(row[colIndex.scoreDelta]) || 0,
        note: colIndex.note >= 0 ? row[colIndex.note]?.toString().trim() : undefined,
        occurredAt: colIndex.occurredAt >= 0 ? this.parseDate(row[colIndex.occurredAt]) : undefined,
      });
    }

    return results;
  }

  // 分类中文转枚举
  private parseCategory(categoryStr: string): string {
    const categoryMap: Record<string, string> = {
      '行为规范': 'behavior',
      '卫生纪律': 'hygiene',
      '学习表现': 'study',
      '活动参与': 'activity',
      '其他': 'other',
    };
    return categoryMap[categoryStr] || 'other';
  }

  // 解析日期
  private parseDate(dateValue: any): string | undefined {
    if (!dateValue) return undefined;
    if (typeof dateValue === 'number') {
      // Excel日期数字转JS日期
      const date = XLSX.SSF.parse_date_code(dateValue);
      return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
    }
    return dateValue.toString().trim();
  }

  // 批量导入事件
  async importEvents(file: Buffer, userId: string) {
    const importData = await this.parseExcel(file);
    
    const errors: Array<{ row: number; studentNo: string; message: string }> = [];
    let successCount = 0;

    // 获取所有学号对应的学生
    const studentNos = importData.map(d => d.studentNo);
    const students = await this.prisma.students.findMany({
      where: { studentNo: { in: studentNos } },
      include: { users: true },
    });

    const studentMap = new Map(students.map(s => [s.studentNo, s]));

    // 批量创建事件
    const eventsToCreate = [];
    for (let i = 0; i < importData.length; i++) {
      const data = importData[i];
      const student = studentMap.get(data.studentNo);

      if (!student) {
        errors.push({
          row: i + 2,
          studentNo: data.studentNo,
          message: '学号不存在',
        });
        continue;
      }

      eventsToCreate.push({
        id: uuidv4(),
        studentId: student.id,
        source: MoralSource.IMPORT,
        category: data.category,
        itemName: data.itemName,
        scoreDelta: data.scoreDelta,
        note: data.note,
        occurredAt: data.occurredAt ? new Date(data.occurredAt) : new Date(),
        createdBy: userId,
        status: MoralStatus.EFFECTIVE,
      });
      successCount++;
    }

    // 批量插入
    if (eventsToCreate.length > 0) {
      await this.prisma.$transaction(
        eventsToCreate.map(event => 
          this.prisma.moral_events.create({ data: event })
        )
      );
    }

    return {
      success: successCount,
      failed: errors.length,
      errors,
      total: importData.length,
    };
  }

  // 获取导入模板
  async getImportTemplate(): Promise<Buffer> {
    const template = [
      ['学号', '分类', '事项名称', '分值', '备注', '发生日期'],
      ['2024001', '卫生纪律', '宿舍内务不整洁', -2, '被子未叠', '2026-02-20'],
      ['2024002', '行为规范', '主动帮助他人', 3, '帮助同学', '2026-02-19'],
    ];

    const ws = XLSX.utils.aoa_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '德育事件导入');
    
    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  }

  // ========== 宿舍德育管理 ==========

  // 获取宿舍德育事件列表
  async findDormEvents(query: QueryDormMoralDto) {
    const { buildingId, roomId, category, startDate, endDate, page = 1, pageSize = 20 } = query;

    const where: any = {
      status: MoralStatus.EFFECTIVE,
    };

    if (category) where.category = category;

    // 日期范围
    if (startDate || endDate) {
      where.occurredAt = {};
      if (startDate) where.occurredAt.gte = new Date(startDate);
      if (endDate) where.occurredAt.lte = new Date(endDate);
    }

    // 宿舍筛选
    if (buildingId || roomId) {
      where.students = {
        dorm_rooms: {},
      };
      if (buildingId) where.students.dorm_rooms.buildingId = buildingId;
      if (roomId) where.students.dormRoomId = roomId;
    }

    const [list, total] = await Promise.all([
      this.prisma.moral_events.findMany({
        where,
        include: {
          students: {
            include: {
              users: true,
              classes: true,
              grades: true,
              dorm_rooms: {
                include: {
                  dorm_buildings: true,
                },
              },
            },
          },
          rules: true,
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { occurredAt: 'desc' },
      }),
      this.prisma.moral_events.count({ where }),
    ]);

    return {
      list,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  // 获取宿舍德育统计（处理混合宿舍）
  async getDormStats(query: QueryDormMoralDto) {
    const { buildingId, roomId, startDate, endDate } = query;

    const where: any = {
      status: MoralStatus.EFFECTIVE,
    };

    // 日期范围
    if (startDate || endDate) {
      where.occurredAt = {};
      if (startDate) where.occurredAt.gte = new Date(startDate);
      if (endDate) where.occurredAt.lte = new Date(endDate);
    }

    // 宿舍筛选
    if (buildingId || roomId) {
      where.students = {
        dorm_rooms: {},
      };
      if (buildingId) where.students.dorm_rooms.buildingId = buildingId;
      if (roomId) where.students.dormRoomId = roomId;
    }

    // 获取所有有效事件（包含宿舍信息）
    const events = await this.prisma.moral_events.findMany({
      where,
      include: {
        students: {
          include: {
            users: true,
            classes: true,
            grades: true,
            dorm_rooms: {
              include: {
                dorm_buildings: true,
              },
            },
          },
        },
      },
    });

    // 按宿舍统计（处理混合宿舍：同一房间可能有不同班级学生）
    const dormMap = new Map();
    const roomClassMap = new Map(); // 记录每个房间的班级分布

    for (const event of events) {
      const student = event.students;
      const roomId = student.dormRoomId;
      const buildingId = student.dorm_rooms?.dorm_buildings?.id;
      const buildingName = student.dorm_rooms?.dorm_buildings?.name;
      const roomNo = student.dorm_rooms?.roomNo;
      const classId = student.classId;
      const className = student.classes?.name;

      if (!roomId) continue;

      const dormKey = `${buildingId}-${roomId}`;
      
      // 初始化宿舍统计
      if (!dormMap.has(dormKey)) {
        dormMap.set(dormKey, {
          buildingId,
          buildingName,
          roomId,
          roomNo,
          totalScore: 0,
          addScore: 0,
          subScore: 0,
          eventCount: 0,
          addCount: 0,
          subCount: 0,
          studentCount: new Set(),
          classes: new Set(),
          studentDetails: [],
        });
        roomClassMap.set(dormKey, new Map());
      }

      const stats = dormMap.get(dormKey);
      stats.totalScore += event.scoreDelta;
      stats.eventCount += 1;
      stats.studentCount.add(student.id);
      stats.classes.add(className);

      // 按班级统计（混合宿舍场景）
      const classStats = roomClassMap.get(dormKey);
      if (!classStats.has(classId)) {
        classStats.set(classId, {
          classId,
          className,
          totalScore: 0,
          eventCount: 0,
        });
      }
      const clsStat = classStats.get(classId);
      clsStat.totalScore += event.scoreDelta;
      clsStat.eventCount += 1;

      if (event.scoreDelta > 0) {
        stats.addScore += event.scoreDelta;
        stats.addCount += 1;
      } else {
        stats.subScore += event.scoreDelta;
        stats.subCount += 1;
      }

      // 学生详情
      stats.studentDetails.push({
        studentId: student.id,
        studentName: student.users?.name,
        studentNo: student.studentNo,
        className,
        scoreDelta: event.scoreDelta,
        itemName: event.itemName,
        occurredAt: event.occurredAt,
      });
    }

    // 转换数据格式
    return Array.from(dormMap.values()).map((stats: any) => ({
      ...stats,
      studentCount: stats.studentCount.size,
      classes: Array.from(stats.classes),
      classBreakdown: Array.from(roomClassMap.get(stats.buildingId + '-' + stats.roomId)?.values() || []),
      avgScore: stats.studentCount.size > 0 
        ? (stats.totalScore / stats.studentCount.size).toFixed(2) 
        : 0,
    }));
  }

  // 获取宿舍楼统计
  async getBuildingStats(query: QueryDormMoralDto) {
    const { startDate, endDate } = query;

    const where: any = {
      status: MoralStatus.EFFECTIVE,
    };

    if (startDate || endDate) {
      where.occurredAt = {};
      if (startDate) where.occurredAt.gte = new Date(startDate);
      if (endDate) where.occurredAt.lte = new Date(endDate);
    }

    // 只筛选有宿舍的学生
    where.students = {
      dormRoomId: { not: null },
    };

    const events = await this.prisma.moral_events.findMany({
      where,
      include: {
        students: {
          include: {
            dorm_rooms: {
              include: {
                dorm_buildings: true,
              },
            },
          },
        },
      },
    });

    // 按楼栋统计
    const buildingMap = new Map();

    for (const event of events) {
      const building = event.students?.dorm_rooms?.dorm_buildings;
      if (!building) continue;

      if (!buildingMap.has(building.id)) {
        buildingMap.set(building.id, {
          buildingId: building.id,
          buildingName: building.name,
          totalScore: 0,
          addScore: 0,
          subScore: 0,
          eventCount: 0,
          addCount: 0,
          subCount: 0,
          roomCount: new Set(),
          studentCount: new Set(),
        });
      }

      const stats = buildingMap.get(building.id);
      stats.totalScore += event.scoreDelta;
      stats.eventCount += 1;
      stats.roomCount.add(event.students.dormRoomId);
      stats.studentCount.add(event.students.id);

      if (event.scoreDelta > 0) {
        stats.addScore += event.scoreDelta;
        stats.addCount += 1;
      } else {
        stats.subScore += event.scoreDelta;
        stats.subCount += 1;
      }
    }

    return Array.from(buildingMap.values()).map((stats: any) => ({
      ...stats,
      roomCount: stats.roomCount.size,
      studentCount: stats.studentCount.size,
      avgScore: stats.studentCount.size > 0
        ? (stats.totalScore / stats.studentCount.size).toFixed(2)
        : 0,
    }));
  }
}
