import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateScoreDto, BatchScoreDto, QueryScoreDto, UpdateScoreDto, ScoreAnalysisDto, ExcelImportDto } from './dto/score.dto';
import { v4 as uuidv4 } from 'uuid';
import * as XLSX from 'xlsx';
import { Request } from 'express';

@Injectable()
export class ScoresService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: QueryScoreDto) {
    const where: any = {};

    if (query.examId) {
      where.examId = query.examId;
    }

    if (query.studentId) {
      where.studentId = query.studentId;
    }

    if (query.subjectId) {
      where.subjectId = query.subjectId;
    }

    if (query.classId) {
      where.students = {
        classId: query.classId,
      };
    }

    if (query.gradeId) {
      where.students = {
        ...where.students,
        gradeId: query.gradeId,
      };
    }

    return this.prisma.scores.findMany({
      where,
      include: {
        students: {
          select: {
            id: true,
            studentNo: true,
            users: {
              select: {
                name: true,
              },
            },
            classes: {
              select: {
                id: true,
                name: true,
              },
            },
            grades: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        exam_subjects: {
          select: {
            maxScore: true,
            subjects: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
        exams: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        students: {
          classId: 'asc',
        },
      },
    });
  }

  async findOne(id: string) {
    const score = await this.prisma.scores.findUnique({
      where: { id },
      include: {
        students: {
          select: {
            id: true,
            studentNo: true,
            users: {
              select: {
                name: true,
              },
            },
            classes: {
              select: {
                id: true,
                name: true,
              },
            },
            grades: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        exam_subjects: {
          select: {
            maxScore: true,
            subjects: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
        exams: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!score) {
      throw new NotFoundException('成绩不存在');
    }

    return score;
  }

  async create(createDto: CreateScoreDto) {
    const examSubject = await this.prisma.exam_subjects.findUnique({
      where: {
        examId_subjectId: {
          examId: createDto.examId,
          subjectId: createDto.subjectId,
        },
      },
    });

    if (!examSubject) {
      throw new NotFoundException('考试科目不存在');
    }

    const student = await this.prisma.students.findUnique({
      where: { id: createDto.studentId },
    });

    if (!student) {
      throw new NotFoundException('学生不存在');
    }

    const existing = await this.prisma.scores.findUnique({
      where: {
        studentId_examId_subjectId: {
          studentId: createDto.studentId,
          examId: createDto.examId,
          subjectId: createDto.subjectId,
        },
      },
    });

    if (existing) {
      throw new BadRequestException('该学生该科目成绩已存在');
    }

    return this.prisma.scores.create({
      data: {
        id: uuidv4(),
        ...createDto,
        updatedAt: new Date(),
      },
      include: {
        students: {
          select: {
            id: true,
            studentNo: true,
            users: {
              select: {
                name: true,
              },
            },
          },
        },
        exam_subjects: {
          select: {
            maxScore: true,
            subjects: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });
  }

  async batchCreate(batchDto: BatchScoreDto) {
    const examSubject = await this.prisma.exam_subjects.findUnique({
      where: {
        examId_subjectId: {
          examId: batchDto.examId,
          subjectId: batchDto.subjectId,
        },
      },
    });

    if (!examSubject) {
      throw new NotFoundException('考试科目不存在');
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [] as { studentId: string; message: string }[],
    };

    for (const scoreData of batchDto.scores) {
      try {
        const student = await this.prisma.students.findUnique({
          where: { id: scoreData.studentId },
        });

        if (!student) {
          results.failed++;
          results.errors.push({
            studentId: scoreData.studentId,
            message: '学生不存在',
          });
          continue;
        }

        await this.prisma.scores.upsert({
          where: {
            studentId_examId_subjectId: {
              studentId: scoreData.studentId,
              examId: batchDto.examId,
              subjectId: batchDto.subjectId,
            },
          },
          create: {
            id: uuidv4(),
            studentId: scoreData.studentId,
            examId: batchDto.examId,
            subjectId: batchDto.subjectId,
            rawScore: scoreData.rawScore,
            isAbsent: scoreData.isAbsent || false,
            updatedAt: new Date(),
          },
          update: {
            rawScore: scoreData.rawScore,
            isAbsent: scoreData.isAbsent || false,
            updatedAt: new Date(),
          },
        });

        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          studentId: scoreData.studentId,
          message: error.message,
        });
      }
    }

    return results;
  }

  async update(id: string, updateDto: UpdateScoreDto) {
    const score = await this.prisma.scores.findUnique({
      where: { id },
    });

    if (!score) {
      throw new NotFoundException('成绩不存在');
    }

    return this.prisma.scores.update({
      where: { id },
      data: updateDto,
    });
  }

  async remove(id: string) {
    const score = await this.prisma.scores.findUnique({
      where: { id },
    });

    if (!score) {
      throw new NotFoundException('成绩不存在');
    }

    return this.prisma.scores.delete({
      where: { id },
    });
  }

  async getAnalysis(dto: ScoreAnalysisDto) {
    const exam = await this.prisma.exams.findUnique({
      where: { id: dto.examId },
      include: {
        exam_subjects: {
          include: {
            subjects: true,
          },
        },
      },
    });

    if (!exam) {
      throw new NotFoundException('考试不存在');
    }

    const where: any = {
      examId: dto.examId,
    };

    if (dto.subjectId) {
      where.subjectId = dto.subjectId;
    }

    if (dto.classId) {
      where.students = {
        classId: dto.classId,
      };
    }

    const scores = await this.prisma.scores.findMany({
      where,
      include: {
        students: {
          select: {
            id: true,
            studentNo: true,
            classId: true,
            users: {
              select: {
                name: true,
              },
            },
            classes: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        exam_subjects: {
          select: {
            maxScore: true,
            subjects: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (scores.length === 0) {
      return {
        total: 0,
        average: 0,
        max: 0,
        min: 0,
        distribution: [],
        classStats: [],
      };
    }

    const subjectId = dto.subjectId || exam.exam_subjects[0]?.subjectId;
    const examSubject = exam.exam_subjects.find((es) => es.subjectId === subjectId);
    const maxScore = examSubject?.maxScore || 100;

    const validScores = scores.filter((s) => !s.isAbsent);
    const rawScores = validScores.map((s) => s.rawScore);

    const total = scores.length;
    const absentCount = scores.filter((s) => s.isAbsent).length;
    const average = rawScores.length > 0 ? rawScores.reduce((a, b) => a + b, 0) / rawScores.length : 0;
    const max = rawScores.length > 0 ? Math.max(...rawScores) : 0;
    const min = rawScores.length > 0 ? Math.min(...rawScores) : 0;

    const distribution = this.calculateDistribution(rawScores, maxScore);

    const classMap = new Map<string, { name: string; scores: number[]; count: number }>();
    scores.forEach((s) => {
      const classId = s.students.classId;
      const className = s.students.classes?.name || '未知班级';
      if (!classMap.has(classId)) {
        classMap.set(classId, { name: className, scores: [], count: 0 });
      }
      const classData = classMap.get(classId)!;
      classData.count++;
      if (!s.isAbsent) {
        classData.scores.push(s.rawScore);
      }
    });

    const classStats = Array.from(classMap.entries()).map(([classId, data]) => ({
      classId,
      className: data.name,
      count: data.count,
      average: data.scores.length > 0 ? data.scores.reduce((a, b) => a + b, 0) / data.scores.length : 0,
      max: data.scores.length > 0 ? Math.max(...data.scores) : 0,
      min: data.scores.length > 0 ? Math.min(...data.scores) : 0,
    }));

    return {
      total,
      absentCount,
      average: Math.round(average * 100) / 100,
      max,
      min,
      maxScore,
      distribution,
      classStats,
    };
  }

  private calculateDistribution(scores: number[], maxScore: number) {
    const segments = [
      { label: '优秀', min: maxScore * 0.9, count: 0 },
      { label: '良好', min: maxScore * 0.8, count: 0 },
      { label: '及格', min: maxScore * 0.6, count: 0 },
      { label: '不及格', min: 0, count: 0 },
    ];

    scores.forEach((score) => {
      if (score >= segments[0].min) {
        segments[0].count++;
      } else if (score >= segments[1].min) {
        segments[1].count++;
      } else if (score >= segments[2].min) {
        segments[2].count++;
      } else {
        segments[3].count++;
      }
    });

    return segments;
  }

  async calculateRanks(examId: string, subjectId?: string) {
    const exam = await this.prisma.exams.findUnique({
      where: { id: examId },
      include: {
        exam_subjects: {
          where: subjectId ? { subjectId } : undefined,
        },
      },
    });

    if (!exam) {
      throw new NotFoundException('考试不存在');
    }

    for (const examSubject of exam.exam_subjects) {
      const scores = await this.prisma.scores.findMany({
        where: {
          examId,
          subjectId: examSubject.subjectId,
          isAbsent: false,
        },
        include: {
          students: {
            select: {
              classId: true,
            },
          },
        },
        orderBy: {
          rawScore: 'desc',
        },
      });

      const classScores = new Map<string, typeof scores>();

      scores.forEach((score, index) => {
        const gradeRank = index + 1;
        const classId = score.students.classId;

        if (!classScores.has(classId)) {
          classScores.set(classId, []);
        }
        classScores.get(classId)!.push({ ...score, gradeRank });
      });

      for (const [classId, classScoreList] of classScores) {
        for (const score of classScoreList) {
          const classRank = classScoreList.indexOf(score) + 1;
          await this.prisma.scores.update({
            where: { id: score.id },
            data: { gradeRank: score.gradeRank, classRank },
          });
        }
      }
    }

    return { message: '排名计算完成' };
  }

  async getExamInfo(examId: string) {
    const exam = await this.prisma.exams.findUnique({
      where: { id: examId },
      include: {
        grades: { select: { name: true } },
        exam_subjects: {
          include: {
            subjects: { select: { id: true, name: true, code: true } },
          },
          orderBy: { subjects: { code: 'asc' } },
        },
      },
    });

    if (!exam) {
      throw new NotFoundException('考试不存在');
    }

    return exam;
  }

  async generateTemplate(examId: string): Promise<Buffer> {
    const exam = await this.getExamInfo(examId);

    const students = await this.prisma.students.findMany({
      where: { gradeId: exam.gradeId },
      include: {
        users: { select: { name: true } },
        classes: { select: { id: true, name: true } },
      },
      orderBy: [{ classId: 'asc' }, { studentNo: 'asc' }],
    });

    const subjectHeaders = exam.exam_subjects.map((es) => `${es.subjects.name}(${es.maxScore}分)`);

    const headerRow = ['班级', '学号', '姓名', ...subjectHeaders, '备注'];

    const dataRows = students.map((student) => [
      student.classes?.name || '',
      student.studentNo,
      student.users.name,
      ...exam.exam_subjects.map(() => ''),
      '',
    ]);

    const ws = XLSX.utils.aoa_to_sheet([headerRow, ...dataRows]);

    ws['!cols'] = [
      { wch: 12 },
      { wch: 12 },
      { wch: 10 },
      ...exam.exam_subjects.map(() => ({ wch: 12 })),
      { wch: 20 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '成绩导入');

    const infoWs = XLSX.utils.aoa_to_sheet([
      ['成绩导入说明'],
      [''],
      ['1. 请勿修改表头结构'],
      ['2. 分数请填写0到满分之间的数值'],
      ['3. 缺考学生请在备注栏填写"缺考"'],
      ['4. 学号必须与系统中的学号一致'],
      [''],
      ['科目配置信息:'],
      ...exam.exam_subjects.map((es) => [
        es.subjects.name,
        `满分: ${es.maxScore}`,
        `优秀线: ${es.excellentLine || ''}`,
        `及格线: ${es.passLine || ''}`,
        `低分线: ${es.lowLine || ''}`,
      ]),
    ]);
    XLSX.utils.book_append_sheet(wb, infoWs, '说明');

    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  }

  async validateScores(examId: string, dto: ExcelImportDto) {
    const exam = await this.getExamInfo(examId);

    const students = await this.prisma.students.findMany({
      where: { gradeId: exam.gradeId },
      select: { id: true, studentNo: true },
    });

    const studentMap = new Map(students.map((s) => [s.studentNo, s.id]));

    const subjectMap = new Map(
      exam.exam_subjects.map((es) => [es.subjects.name, { id: es.subjectId, maxScore: es.maxScore }]),
    );

    const results = {
      valid: [] as any[],
      invalid: [] as any[],
      summary: {
        total: dto.data.length,
        validCount: 0,
        invalidCount: 0,
      },
    };

    for (const row of dto.data) {
      const errors: string[] = [];
      const studentId = studentMap.get(row.studentNo);

      if (!studentId) {
        errors.push(`学号 ${row.studentNo} 不存在`);
      }

      const scores: { subjectId: string; subjectName: string; score: number; isAbsent: boolean }[] = [];

      for (const [subjectName, scoreValue] of Object.entries(row.scores)) {
        const subjectInfo = subjectMap.get(subjectName);
        if (!subjectInfo) {
          errors.push(`科目 ${subjectName} 不存在`);
          continue;
        }

        const score = Number(scoreValue);
        if (isNaN(score) || score < 0) {
          errors.push(`${subjectName} 分数无效`);
          continue;
        }

        if (score > subjectInfo.maxScore) {
          errors.push(`${subjectName} 分数 ${score} 超过满分 ${subjectInfo.maxScore}`);
          continue;
        }

        scores.push({
          subjectId: subjectInfo.id,
          subjectName,
          score,
          isAbsent: row.isAbsent || false,
        });
      }

      if (errors.length > 0) {
        results.invalid.push({
          row,
          errors,
        });
        results.summary.invalidCount++;
      } else {
        results.valid.push({
          studentId,
          studentNo: row.studentNo,
          studentName: row.studentName,
          scores,
        });
        results.summary.validCount++;
      }
    }

    return results;
  }

  async exportScores(examId: string, classId?: string): Promise<Buffer> {
    const exam = await this.getExamInfo(examId);

    const where: any = { examId };
    if (classId) {
      where.students = { classId };
    }

    const scores = await this.prisma.scores.findMany({
      where,
      include: {
        students: {
          select: {
            id: true,
            studentNo: true,
            users: { select: { name: true } },
            classes: { select: { id: true, name: true } },
          },
        },
        exam_subjects: {
          select: {
            maxScore: true,
            subjects: { select: { id: true, name: true, code: true } },
          },
        },
      },
      orderBy: [{ students: { classId: 'asc' } }, { students: { studentNo: 'asc' } }],
    });

    const studentMap = new Map<string, {
      studentNo: string;
      studentName: string;
      className: string;
      scores: Map<string, { score: number; classRank: number | null; gradeRank: number | null; isAbsent: boolean }>;
    }>();

    for (const score of scores) {
      const studentId = score.students.id;
      if (!studentMap.has(studentId)) {
        studentMap.set(studentId, {
          studentNo: score.students.studentNo,
          studentName: score.students.users.name,
          className: score.students.classes?.name || '',
          scores: new Map(),
        });
      }
      const studentData = studentMap.get(studentId)!;
      studentData.scores.set(score.subjectId, {
        score: score.rawScore,
        classRank: score.classRank,
        gradeRank: score.gradeRank,
        isAbsent: score.isAbsent,
      });
    }

    const subjects = exam.exam_subjects;
    const subjectHeaders = subjects.map((es) => [
      es.subjects.name,
      `${es.subjects.name}班排`,
      `${es.subjects.name}级排`,
    ]).flat();

    const headerRow = ['班级', '学号', '姓名', ...subjectHeaders, '总分', '总分班排', '总分级排'];

    const dataRows: any[][] = [];

    for (const [, studentData] of studentMap) {
      const row: any[] = [
        studentData.className,
        studentData.studentNo,
        studentData.studentName,
      ];

      let totalScore = 0;
      let hasScore = false;

      for (const es of subjects) {
        const scoreData = studentData.scores.get(es.subjectId);
        if (scoreData) {
          if (!scoreData.isAbsent) {
            row.push(scoreData.score);
            totalScore += scoreData.score;
            hasScore = true;
          } else {
            row.push('缺考');
          }
          row.push(scoreData.classRank || '-');
          row.push(scoreData.gradeRank || '-');
        } else {
          row.push('', '', '');
        }
      }

      row.push(hasScore ? totalScore : '-');
      row.push('-', '-');

      dataRows.push(row);
    }

    dataRows.sort((a, b) => {
      const totalA = typeof a[a.length - 3] === 'number' ? a[a.length - 3] : 0;
      const totalB = typeof b[b.length - 3] === 'number' ? b[b.length - 3] : 0;
      return totalB - totalA;
    });

    const ws = XLSX.utils.aoa_to_sheet([headerRow, ...dataRows]);

    const colWidths = [
      { wch: 12 },
      { wch: 12 },
      { wch: 10 },
    ];
    for (let i = 0; i < subjects.length; i++) {
      colWidths.push({ wch: 8 }, { wch: 8 }, { wch: 8 });
    }
    colWidths.push({ wch: 8 }, { wch: 8 }, { wch: 8 });
    ws['!cols'] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '成绩明细');

    const summaryHeader = ['班级', '人数', ...subjects.map((es) => `${es.subjects.name}均分`), '总分均分'];
    const classMap = new Map<string, { count: number; subjectScores: Map<string, number[]>; totalScores: number[] }>();

    for (const [, studentData] of studentMap) {
      const className = studentData.className;
      if (!classMap.has(className)) {
        classMap.set(className, {
          count: 0,
          subjectScores: new Map(),
          totalScores: [],
        });
      }
      const classData = classMap.get(className)!;
      classData.count++;

      let totalScore = 0;
      for (const es of subjects) {
        const scoreData = studentData.scores.get(es.subjectId);
        if (scoreData && !scoreData.isAbsent) {
          if (!classData.subjectScores.has(es.subjectId)) {
            classData.subjectScores.set(es.subjectId, []);
          }
          classData.subjectScores.get(es.subjectId)!.push(scoreData.score);
          totalScore += scoreData.score;
        }
      }
      classData.totalScores.push(totalScore);
    }

    const summaryRows: any[][] = [];
    for (const [className, classData] of classMap) {
      const row: any[] = [className, classData.count];
      for (const es of subjects) {
        const scores = classData.subjectScores.get(es.subjectId) || [];
        const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
        row.push(Math.round(avg * 100) / 100);
      }
      const totalAvg = classData.totalScores.length > 0
        ? classData.totalScores.reduce((a, b) => a + b, 0) / classData.totalScores.length
        : 0;
      row.push(Math.round(totalAvg * 100) / 100);
      summaryRows.push(row);
    }

    const summaryWs = XLSX.utils.aoa_to_sheet([summaryHeader, ...summaryRows]);
    XLSX.utils.book_append_sheet(wb, summaryWs, '班级统计');

    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  }

  async importFromExcel(examId: string, req: Request) {
    const exam = await this.getExamInfo(examId);

    const busboy = (await import('busboy')).default;
    
    return new Promise((resolve, reject) => {
      const bb = busboy({ headers: req.headers as any });
      let fileBuffer: Buffer[] = [];

      bb.on('file', (fieldname: string, file: NodeJS.ReadableStream) => {
        file.on('data', (data: Buffer) => fileBuffer.push(data));
      });

      bb.on('finish', async () => {
        try {
          const buffer = Buffer.concat(fileBuffer);
          const workbook = XLSX.read(buffer, { type: 'buffer' });
          
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

          if (jsonData.length < 2) {
            throw new BadRequestException('Excel文件为空或格式不正确');
          }

          const header = jsonData[0];
          const classNameIndex = header.indexOf('班级');
          const studentNoIndex = header.indexOf('学号');
          const studentNameIndex = header.indexOf('姓名');
          const remarkIndex = header.indexOf('备注');

          if (studentNoIndex === -1) {
            throw new BadRequestException('缺少学号列');
          }

          const subjectColumns: { name: string; index: number; subjectId: string; maxScore: number }[] = [];
          for (let i = 0; i < header.length; i++) {
            const colName = header[i];
            if (colName && typeof colName === 'string') {
              for (const es of exam.exam_subjects) {
                if (colName.includes(es.subjects.name)) {
                  subjectColumns.push({
                    name: es.subjects.name,
                    index: i,
                    subjectId: es.subjectId,
                    maxScore: es.maxScore,
                  });
                  break;
                }
              }
            }
          }

          const students = await this.prisma.students.findMany({
            where: { gradeId: exam.gradeId },
            select: { id: true, studentNo: true },
          });
          const studentMap = new Map(students.map((s) => [s.studentNo, s.id]));

          const results = {
            success: 0,
            failed: 0,
            errors: [] as { row: number; message: string }[],
          };

          for (let rowIndex = 1; rowIndex < jsonData.length; rowIndex++) {
            const row = jsonData[rowIndex];
            if (!row || row.length === 0) continue;

            const studentNo = String(row[studentNoIndex] || '').trim();
            const remark = remarkIndex !== -1 ? String(row[remarkIndex] || '').trim() : '';
            const isAbsent = remark === '缺考';

            const studentId = studentMap.get(studentNo);
            if (!studentId) {
              results.failed++;
              results.errors.push({ row: rowIndex + 1, message: `学号 ${studentNo} 不存在` });
              continue;
            }

            for (const subjectCol of subjectColumns) {
              const scoreValue = row[subjectCol.index];
              const score = Number(scoreValue);

              if (isNaN(score) && !isAbsent) {
                continue;
              }

              if (!isAbsent && (score < 0 || score > subjectCol.maxScore)) {
                results.failed++;
                results.errors.push({
                  row: rowIndex + 1,
                  message: `${studentNo} ${subjectCol.name} 分数 ${score} 超出范围`,
                });
                continue;
              }

              try {
                await this.prisma.scores.upsert({
                  where: {
                    studentId_examId_subjectId: {
                      studentId,
                      examId,
                      subjectId: subjectCol.subjectId,
                    },
                  },
                  create: {
                    id: uuidv4(),
                    studentId,
                    examId,
                    subjectId: subjectCol.subjectId,
                    rawScore: isAbsent ? 0 : score,
                    isAbsent,
                    updatedAt: new Date(),
                  },
                  update: {
                    rawScore: isAbsent ? 0 : score,
                    isAbsent,
                    updatedAt: new Date(),
                  },
                });
                results.success++;
              } catch (error) {
                results.failed++;
                results.errors.push({
                  row: rowIndex + 1,
                  message: `${studentNo} ${subjectCol.name} 导入失败: ${error.message}`,
                });
              }
            }
          }

          resolve(results);
        } catch (error) {
          reject(error);
        }
      });

      bb.on('error', reject);
      req.pipe(bb);
    });
  }
}
