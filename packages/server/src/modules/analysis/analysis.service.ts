import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AnalysisQueryDto, ProgressAnalysisDto, CriticalStudentDto, SubjectBalanceDto } from './dto/analysis.dto';
import * as ss from 'simple-statistics';

@Injectable()
export class AnalysisService {
  constructor(private prisma: PrismaService) {}

  async getBasicStatistics(dto: AnalysisQueryDto) {
    const exam = await this.prisma.exams.findUnique({
      where: { id: dto.examId },
      include: {
        exam_subjects: {
          include: {
            subjects: true,
          },
        },
        grades: true,
      },
    });

    if (!exam) {
      throw new NotFoundException('考试不存在');
    }

    // 获取所有成绩数据
    const allScores = await this.prisma.scores.findMany({
      where: { examId: dto.examId },
      include: {
        students: {
          select: {
            id: true,
            studentNo: true,
            classId: true,
            users: { select: { name: true } },
            classes: { select: { id: true, name: true } },
          },
        },
        exam_subjects: {
          select: {
            maxScore: true,
            excellentLine: true,
            passLine: true,
            lowLine: true,
            includeInTotal: true,
            subjects: { select: { id: true, name: true } },
          },
        },
      },
    });

    // 按学生分组计算总分
    const studentScores = new Map<string, {
      student: any;
      scores: typeof allScores;
      totalScore: number;
      totalMaxScore: number;
      validSubjectCount: number;
    }>();

    allScores.forEach((s) => {
      if (!studentScores.has(s.studentId)) {
        studentScores.set(s.studentId, {
          student: s.students,
          scores: [],
          totalScore: 0,
          totalMaxScore: 0,
          validSubjectCount: 0,
        });
      }
      const studentData = studentScores.get(s.studentId)!;
      studentData.scores.push(s);
      if (!s.isAbsent && s.exam_subjects.includeInTotal) {
        studentData.totalScore += s.rawScore;
        studentData.totalMaxScore += s.exam_subjects.maxScore;
        studentData.validSubjectCount++;
      }
    });

    // 筛选班级
    let filteredStudents = Array.from(studentScores.values());
    if (dto.classId) {
      filteredStudents = filteredStudents.filter((s) => s.student.classId === dto.classId);
    }

    // 判断是总分模式还是科目模式
    const isTotalMode = !dto.subjectId;

    if (isTotalMode) {
      // 总分模式统计
      return this.calculateTotalStatistics(filteredStudents, exam, dto);
    } else {
      // 科目模式统计
      return this.calculateSubjectStatistics(filteredStudents, exam, dto);
    }
  }

  private async calculateTotalStatistics(
    students: any[],
    exam: any,
    dto: AnalysisQueryDto,
  ) {
    const totalScores = students.map((s) => s.totalScore).filter((s) => s > 0);
    const total = students.length;

    // 获取线位配置
    const scoreLines = await this.prisma.score_lines.findMany({
      where: {
        gradeId: exam.gradeId,
        isActive: true,
      },
    });

    // 计算线位分布
    const lineDistribution = scoreLines.map((line) => {
      const aboveCount = students.filter((s) => s.totalScore >= line.scoreValue).length;
      const belowCount = students.filter((s) => s.totalScore < line.scoreValue).length;
      return {
        name: line.name,
        value: line.scoreValue,
        aboveCount,
        belowCount,
        aboveRate: total > 0 ? Math.round((aboveCount / total) * 100) : 0,
      };
    });

    // 计算统计数据
    const statistics = totalScores.length > 0 ? {
      average: Math.round(ss.mean(totalScores) * 100) / 100,
      median: Math.round(ss.median(totalScores) * 100) / 100,
      max: ss.max(totalScores),
      min: ss.min(totalScores),
      standardDeviation: Math.round(ss.standardDeviation(totalScores) * 100) / 100,
    } : null;

    // 获取排名列表
    const rankingList = students
      .filter((s) => s.totalScore > 0)
      .sort((a, b) => b.totalScore - a.totalScore)
      .map((s, index) => ({
        rank: index + 1,
        studentId: s.student.id,
        studentNo: s.student.studentNo,
        name: s.student.users.name,
        className: s.student.classes?.name,
        totalScore: s.totalScore,
      }));

    return {
      mode: 'total',
      exam: {
        id: exam.id,
        name: exam.name,
        gradeName: exam.grades?.name,
      },
      total,
      statistics,
      lineDistribution,
      rankingList: rankingList.slice(0, 50), // 前50名
      fullRankingList: rankingList,
    };
  }

  private async calculateSubjectStatistics(
    students: any[],
    exam: any,
    dto: AnalysisQueryDto,
  ) {
    const subjectId = dto.subjectId!;
    const subjectConfig = exam.exam_subjects.find((es: any) => es.subjectId === subjectId);

    if (!subjectConfig) {
      throw new NotFoundException('科目不存在');
    }

    // 提取该科目的成绩 - 使用 exam_subjects.id 匹配
    const subjectScores: { student: any; score: number; isAbsent: boolean }[] = [];
    students.forEach((s) => {
      const score = s.scores.find((sc: any) => sc.exam_subjects?.subjects?.id === subjectId || sc.subjectId === subjectConfig.id);
      if (score) {
        subjectScores.push({
          student: s.student,
          score: score.rawScore,
          isAbsent: score.isAbsent,
        });
      }
    });

    const validScores = subjectScores.filter((s) => !s.isAbsent);
    const scores = validScores.map((s) => s.score);
    const total = subjectScores.length;
    const absentCount = subjectScores.filter((s) => s.isAbsent).length;

    const maxScore = subjectConfig.maxScore;

    // 从分段规则表中读取分数线
    const scoreSegment = await this.prisma.score_segments.findFirst({
      where: {
        gradeId: exam.gradeId,
        subjectId: subjectId,
        isActive: true,
      },
      orderBy: {
        isDefault: 'desc',
      },
    });

    // 使用分段规则或默认值
    const excellentLine = scoreSegment?.excellentMin ?? subjectConfig.excellentLine ?? maxScore * 0.9;
    const goodLine = scoreSegment?.goodMin ?? maxScore * 0.8;
    const passLine = scoreSegment?.passMin ?? subjectConfig.passLine ?? maxScore * 0.6;
    const failLine = scoreSegment?.failMax ?? passLine - 1;

    // 计算分数段 - 修正区间逻辑
    // 优秀: >= 优秀线
    // 良好: >= 良好线 且 < 优秀线
    // 及格: >= 及格线 且 < 良好线
    // 不及格: < 及格线
    const excellentCount = scores.filter((s) => s >= excellentLine).length;
    const goodCount = scores.filter((s) => s >= goodLine && s < excellentLine).length;
    const passCount = scores.filter((s) => s >= passLine && s < goodLine).length;
    const failCount = scores.filter((s) => s < passLine).length;

    const segments = [
      { label: '优秀', count: excellentCount, percentage: total > 0 ? Math.round((excellentCount / total) * 100) : 0, threshold: excellentLine },
      { label: '良好', count: goodCount, percentage: total > 0 ? Math.round((goodCount / total) * 100) : 0, threshold: goodLine },
      { label: '及格', count: passCount, percentage: total > 0 ? Math.round((passCount / total) * 100) : 0, threshold: passLine },
      { label: '不及格', count: failCount, percentage: total > 0 ? Math.round((failCount / total) * 100) : 0, threshold: 0 },
    ];

    // 计算统计数据
    const statistics = scores.length > 0 ? {
      average: Math.round(ss.mean(scores) * 100) / 100,
      median: Math.round(ss.median(scores) * 100) / 100,
      max: ss.max(scores),
      min: ss.min(scores),
      standardDeviation: Math.round(ss.standardDeviation(scores) * 100) / 100,
      excellentRate: total > 0 ? Math.round((excellentCount / total) * 100) : 0,
      passRate: total > 0 ? Math.round(((excellentCount + goodCount + passCount) / total) * 100) : 0,
    } : null;

    // 获取排名列表
    const rankingList = validScores
      .sort((a, b) => b.score - a.score)
      .map((s, index) => ({
        rank: index + 1,
        studentId: s.student.id,
        studentNo: s.student.studentNo,
        name: s.student.users.name,
        className: s.student.classes?.name,
        score: s.score,
      }));

    return {
      mode: 'subject',
      exam: {
        id: exam.id,
        name: exam.name,
        gradeName: exam.grades?.name,
      },
      subject: subjectConfig.subjects,
      total,
      absentCount,
      maxScore,
      scoreLines: {
        excellent: excellentLine,
        good: goodLine,
        pass: passLine,
      },
      statistics,
      segments,
      excellentCount,
      goodCount,
      passCount,
      failCount,
      rankingList: rankingList.slice(0, 50),
      fullRankingList: rankingList,
    };
  }

  async getClassComparison(dto: AnalysisQueryDto) {
    const exam = await this.prisma.exams.findUnique({
      where: { id: dto.examId },
      include: { grades: true, exam_subjects: { include: { subjects: true } } },
    });

    if (!exam) {
      throw new NotFoundException('考试不存在');
    }

    const classes = await this.prisma.classes.findMany({
      where: { gradeId: exam.gradeId },
      select: { id: true, name: true },
    });

    const allScores = await this.prisma.scores.findMany({
      where: { examId: dto.examId },
      include: {
        students: { select: { classId: true } },
        exam_subjects: { select: { maxScore: true, includeInTotal: true } },
      },
    });

    const classStats = await Promise.all(
      classes.map(async (cls) => {
        const classScores = allScores.filter((s) => s.students.classId === cls.id);
        
        // 按学生分组
        const studentMap = new Map<string, number[]>();
        classScores.forEach((s) => {
          if (!studentMap.has(s.studentId)) {
            studentMap.set(s.studentId, []);
          }
          if (!s.isAbsent && s.exam_subjects.includeInTotal) {
            studentMap.get(s.studentId)!.push(s.rawScore);
          }
        });

        const totalScores = Array.from(studentMap.values())
          .filter((scores) => scores.length > 0)
          .map((scores) => scores.reduce((a, b) => a + b, 0));

        const total = studentMap.size;

        return {
          classId: cls.id,
          className: cls.name,
          total,
          average: totalScores.length > 0 ? Math.round(ss.mean(totalScores) * 100) / 100 : 0,
          max: totalScores.length > 0 ? ss.max(totalScores) : 0,
          min: totalScores.length > 0 ? ss.min(totalScores) : 0,
        };
      }),
    );

    return {
      exam: {
        id: exam.id,
        name: exam.name,
        gradeName: exam.grades?.name,
      },
      classes: classStats.sort((a, b) => b.average - a.average),
    };
  }

  async getProgressAnalysis(dto: ProgressAnalysisDto) {
    const [currentExam, previousExam] = await Promise.all([
      this.prisma.exams.findUnique({
        where: { id: dto.currentExamId },
        include: { grades: true, exam_subjects: { include: { subjects: true } } },
      }),
      this.prisma.exams.findUnique({
        where: { id: dto.previousExamId },
        include: { grades: true },
      }),
    ]);

    if (!currentExam || !previousExam) {
      throw new NotFoundException('考试不存在');
    }

    const currentScores = await this.prisma.scores.findMany({
      where: {
        examId: dto.currentExamId,
        students: dto.classId ? { classId: dto.classId } : undefined,
      },
      include: {
        students: {
          select: {
            id: true,
            studentNo: true,
            classId: true,
            users: { select: { name: true } },
            classes: { select: { name: true } },
          },
        },
        exam_subjects: { select: { includeInTotal: true } },
      },
    });

    const previousScores = await this.prisma.scores.findMany({
      where: {
        examId: dto.previousExamId,
        students: dto.classId ? { classId: dto.classId } : undefined,
      },
      include: {
        students: {
          select: {
            id: true,
            studentNo: true,
            classId: true,
            users: { select: { name: true } },
            classes: { select: { name: true } },
          },
        },
        exam_subjects: { select: { includeInTotal: true } },
      },
    });

    // 计算总分排名
    const calculateTotalScores = (scores: typeof currentScores) => {
      const studentMap = new Map<string, { student: any; total: number }>();
      scores.forEach((s) => {
        if (!studentMap.has(s.studentId)) {
          studentMap.set(s.studentId, { student: s.students, total: 0 });
        }
        if (!s.isAbsent && s.exam_subjects.includeInTotal) {
          studentMap.get(s.studentId)!.total += s.rawScore;
        }
      });
      return Array.from(studentMap.entries())
        .filter(([, data]) => data.total > 0)
        .sort((a, b) => b[1].total - a[1].total);
    };

    const currentTotals = calculateTotalScores(currentScores);
    const previousTotals = calculateTotalScores(previousScores);

    const currentRankMap = new Map(currentTotals.map(([id], index) => [id, index + 1]));
    const previousRankMap = new Map(previousTotals.map(([id], index) => [id, index + 1]));

    const progressList = currentTotals.map(([studentId, data]) => {
      const currentRank = currentRankMap.get(studentId) || 0;
      const previousRank = previousRankMap.get(studentId) || 0;
      const rankChange = previousRank > 0 ? previousRank - currentRank : 0;

      return {
        studentId,
        studentNo: data.student.studentNo,
        name: data.student.users.name,
        className: data.student.classes?.name,
        currentRank,
        previousRank: previousRank > 0 ? previousRank : null,
        rankChange,
        progress: rankChange > 0 ? 'up' : rankChange < 0 ? 'down' : 'stable',
      };
    });

    return {
      currentExam: { id: currentExam.id, name: currentExam.name },
      previousExam: { id: previousExam.id, name: previousExam.name },
      students: progressList,
    };
  }

  async getCriticalStudents(dto: CriticalStudentDto) {
    const exam = await this.prisma.exams.findUnique({
      where: { id: dto.examId },
      include: {
        grades: true,
        exam_subjects: { include: { subjects: true } },
      },
    });

    if (!exam) {
      throw new NotFoundException('考试不存在');
    }

    const scoreLines = await this.prisma.score_lines.findMany({
      where: {
        gradeId: exam.gradeId,
        isActive: true,
        ...(dto.lineType ? { type: dto.lineType as any } : {}),
      },
    });

    const range = dto.range || 10;

    // 获取学生总分
    const allScores = await this.prisma.scores.findMany({
      where: { examId: dto.examId },
      include: {
        students: {
          select: {
            id: true,
            studentNo: true,
            classId: true,
            users: { select: { name: true } },
            classes: { select: { name: true } },
          },
        },
        exam_subjects: { select: { includeInTotal: true } },
      },
    });

    const studentTotals = new Map<string, {
      student: any;
      totalScore: number;
    }>();

    allScores.forEach((s) => {
      if (!studentTotals.has(s.studentId)) {
        studentTotals.set(s.studentId, {
          student: s.students,
          totalScore: 0,
        });
      }
      if (!s.isAbsent && s.exam_subjects.includeInTotal) {
        studentTotals.get(s.studentId)!.totalScore += s.rawScore;
      }
    });

    const criticalStudents: any[] = [];

    for (const line of scoreLines) {
      const lineValue = line.scoreValue;
      const upperBound = lineValue + range;
      const lowerBound = lineValue - range;

      studentTotals.forEach((data) => {
        const total = data.totalScore;
        if (total >= lowerBound && total <= upperBound) {
          const distance = total - lineValue;
          criticalStudents.push({
            studentId: data.student.id,
            studentNo: data.student.studentNo,
            name: data.student.users.name,
            classId: data.student.classId,
            className: data.student.classes?.name,
            totalScore: total,
            lineName: line.name,
            lineType: line.type,
            lineValue,
            distance: Math.round(distance * 100) / 100,
            position: distance >= 0 ? 'above' : 'below',
          });
        }
      });
    }

    return {
      exam: { id: exam.id, name: exam.name, gradeName: exam.grades?.name },
      lines: scoreLines.map((l) => ({ name: l.name, type: l.type, value: l.scoreValue })),
      range,
      students: criticalStudents.sort((a, b) => Math.abs(a.distance) - Math.abs(b.distance)),
    };
  }

  async getSubjectBalance(dto: SubjectBalanceDto) {
    const exam = await this.prisma.exams.findUnique({
      where: { id: dto.examId },
      include: {
        exam_subjects: {
          include: { subjects: true },
        },
        grades: true,
      },
    });

    if (!exam) {
      throw new NotFoundException('考试不存在');
    }

    const threshold = dto.threshold || 20;

    const where: any = { examId: dto.examId };
    if (dto.classId) where.students = { classId: dto.classId };

    const scores = await this.prisma.scores.findMany({
      where,
      include: {
        students: {
          select: {
            id: true,
            studentNo: true,
            users: { select: { name: true } },
            classes: { select: { name: true } },
          },
        },
        exam_subjects: {
          select: {
            maxScore: true,
            subjects: { select: { id: true, name: true, code: true } },
          },
        },
      },
    });

    const studentScores = new Map<string, {
      student: any;
      subjects: Map<string, { score: number; maxScore: number; name: string }>;
    }>();

    scores.forEach((s) => {
      if (!studentScores.has(s.studentId)) {
        studentScores.set(s.studentId, {
          student: s.students,
          subjects: new Map(),
        });
      }
      studentScores.get(s.studentId)!.subjects.set(s.subjectId, {
        score: s.rawScore,
        maxScore: s.exam_subjects.maxScore,
        name: s.exam_subjects.subjects.name,
      });
    });

    const subjectStats = new Map<string, { scores: number[]; maxScore: number }>();
    scores.forEach((s) => {
      if (!subjectStats.has(s.subjectId)) {
        subjectStats.set(s.subjectId, { scores: [], maxScore: s.exam_subjects.maxScore });
      }
      subjectStats.get(s.subjectId)!.scores.push(s.rawScore);
    });

    const subjectRanks = new Map<string, Map<string, number>>();
    subjectStats.forEach((stats, subjectId) => {
      const sorted = [...stats.scores].sort((a, b) => b - a);
      const rankMap = new Map<string, number>();
      scores.filter((s) => s.subjectId === subjectId).forEach((s) => {
        rankMap.set(s.studentId, sorted.indexOf(s.rawScore) + 1);
      });
      subjectRanks.set(subjectId, rankMap);
    });

    const totalStudents = studentScores.size;
    const results: any[] = [];

    studentScores.forEach((data, studentId) => {
      const subjectPercentiles: { subjectId: string; percentile: number; name: string }[] = [];
      data.subjects.forEach((subjectData, subjectId) => {
        const rank = subjectRanks.get(subjectId)?.get(studentId) || 0;
        const totalInSubject = subjectStats.get(subjectId)?.scores.length || 1;
        const percentile = Math.round(((totalInSubject - rank) / totalInSubject) * 100);
        subjectPercentiles.push({ subjectId, percentile, name: subjectData.name });
      });

      const avgPercentile = subjectPercentiles.length > 0
        ? Math.round(subjectPercentiles.reduce((a, b) => a + b.percentile, 0) / subjectPercentiles.length)
        : 0;

      const maxPercentile = Math.max(...subjectPercentiles.map((s) => s.percentile));
      const minPercentile = Math.min(...subjectPercentiles.map((s) => s.percentile));
      const diff = maxPercentile - minPercentile;

      const isImbalanced = diff > threshold;

      results.push({
        studentId,
        studentNo: data.student.studentNo,
        name: data.student.users.name,
        className: data.student.classes?.name,
        averagePercentile: avgPercentile,
        maxPercentileDiff: diff,
        isImbalanced,
        imbalancedSubjects: isImbalanced
          ? [
              ...subjectPercentiles
                .filter((s) => s.percentile === minPercentile)
                .map((s) => ({ ...s, type: 'weak' })),
              ...subjectPercentiles
                .filter((s) => s.percentile === maxPercentile)
                .map((s) => ({ ...s, type: 'strong' })),
            ]
          : [],
      });
    });

    return {
      exam: { id: exam.id, name: exam.name, gradeName: exam.grades?.name },
      totalStudents,
      imbalancedCount: results.filter((r) => r.isImbalanced).length,
      threshold,
      students: results.sort((a, b) => b.maxPercentileDiff - a.maxPercentileDiff),
    };
  }

  async getRadarData(dto: AnalysisQueryDto) {
    const exam = await this.prisma.exams.findUnique({
      where: { id: dto.examId },
      include: {
        exam_subjects: { include: { subjects: true } },
      },
    });

    if (!exam) {
      throw new NotFoundException('考试不存在');
    }

    const where: any = { examId: dto.examId };
    if (dto.classId) where.students = { classId: dto.classId };

    const scores = await this.prisma.scores.findMany({
      where,
      include: {
        exam_subjects: { select: { maxScore: true, subjects: true } },
      },
    });

    const subjectStats = new Map<string, { scores: number[]; maxScore: number; name: string }>();
    scores.forEach((s) => {
      const subjectId = s.subjectId;
      if (!subjectStats.has(subjectId)) {
        subjectStats.set(subjectId, {
          scores: [],
          maxScore: s.exam_subjects.maxScore,
          name: s.exam_subjects.subjects.name,
        });
      }
      subjectStats.get(subjectId)!.scores.push(s.rawScore);
    });

    const radarData = Array.from(subjectStats.entries()).map(([subjectId, data]) => {
      const average = data.scores.length > 0 ? ss.mean(data.scores) : 0;
      const percentage = Math.round((average / data.maxScore) * 100);
      return {
        subjectId,
        subject: data.name,
        average: Math.round(average * 100) / 100,
        maxScore: data.maxScore,
        percentage,
      };
    });

    return {
      exam: { id: exam.id, name: exam.name },
      radarData,
    };
  }

  private calculateSegments(scores: number[], maxScore: number) {
    const excellentThreshold = maxScore * 0.9;
    const goodThreshold = maxScore * 0.8;
    const passThreshold = maxScore * 0.6;

    const segments = [
      { label: '优秀', min: excellentThreshold, count: 0, percentage: 0 },
      { label: '良好', min: goodThreshold, max: excellentThreshold, count: 0, percentage: 0 },
      { label: '及格', min: passThreshold, max: goodThreshold, count: 0, percentage: 0 },
      { label: '不及格', min: 0, max: passThreshold, count: 0, percentage: 0 },
    ];

    const total = scores.length;

    scores.forEach((score) => {
      if (score >= excellentThreshold) {
        segments[0].count++;
      } else if (score >= goodThreshold) {
        segments[1].count++;
      } else if (score >= passThreshold) {
        segments[2].count++;
      } else {
        segments[3].count++;
      }
    });

    segments.forEach((seg) => {
      seg.percentage = total > 0 ? Math.round((seg.count / total) * 100) : 0;
    });

    return { total, details: segments };
  }

  private async getStudentTotalScores(examId: string) {
    const scores = await this.prisma.scores.findMany({
      where: { examId },
      include: {
        students: {
          select: {
            id: true,
            studentNo: true,
            classId: true,
            users: { select: { name: true } },
            classes: { select: { name: true } },
          },
        },
        exam_subjects: { select: { includeInTotal: true } },
      },
    });

    const studentMap = new Map<string, {
      studentId: string;
      studentNo: string;
      name: string;
      classId: string;
      className: string;
      totalScore: number;
    }>();

    scores.forEach((s) => {
      if (!studentMap.has(s.studentId)) {
        studentMap.set(s.studentId, {
          studentId: s.studentId,
          studentNo: s.students.studentNo,
          name: s.students.users.name,
          classId: s.students.classId,
          className: s.students.classes?.name || '',
          totalScore: 0,
        });
      }
      if (!s.isAbsent && s.exam_subjects.includeInTotal) {
        studentMap.get(s.studentId)!.totalScore += s.rawScore;
      }
    });

    return Array.from(studentMap.values()).filter((s) => s.totalScore > 0);
  }
}
