import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { analysisApi, examsApi, gradesApi, classesApi } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  Users,
  AlertTriangle,
  Download,
  Eye,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Modal } from '@/components/ui/modal';

export default function Analysis() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SCHOOL_ADMIN';

  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [previousExamId, setPreviousExamId] = useState<string>('');
  const [lineType, setLineType] = useState<string>('');
  const [range, setRange] = useState<number>(10);
  const [threshold, setThreshold] = useState<number>(20);
  const [showRankingModal, setShowRankingModal] = useState(false);

  const { data: exams } = useQuery({
    queryKey: ['exams'],
    queryFn: async () => {
      const res = await examsApi.list({});
      return res.data;
    },
    enabled: isAdmin,
  });

  const selectedExam = exams?.find((e: any) => e.id === selectedExamId);

  const { data: classes } = useQuery({
    queryKey: ['classes', selectedExam?.gradeId],
    queryFn: async () => {
      if (!selectedExam?.gradeId) return [];
      const res = await classesApi.list({ gradeId: selectedExam.gradeId });
      return res.data;
    },
    enabled: !!selectedExam?.gradeId,
  });

  const { data: statistics } = useQuery({
    queryKey: ['analysis-statistics', selectedExamId, selectedSubjectId, selectedClassId],
    queryFn: async () => {
      if (!selectedExamId) return null;
      const res = await analysisApi.getStatistics({
        examId: selectedExamId,
        subjectId: selectedSubjectId || undefined,
        classId: selectedClassId || undefined,
      });
      return res.data;
    },
    enabled: !!selectedExamId,
  });

  const { data: classComparison } = useQuery({
    queryKey: ['analysis-class-comparison', selectedExamId],
    queryFn: async () => {
      if (!selectedExamId) return null;
      const res = await analysisApi.getClassComparison({
        examId: selectedExamId,
      });
      return res.data;
    },
    enabled: !!selectedExamId,
  });

  const { data: progress } = useQuery({
    queryKey: ['analysis-progress', selectedExamId, previousExamId, selectedClassId],
    queryFn: async () => {
      if (!selectedExamId || !previousExamId) return null;
      const res = await analysisApi.getProgress({
        currentExamId: selectedExamId,
        previousExamId,
        classId: selectedClassId || undefined,
      });
      return res.data;
    },
    enabled: !!selectedExamId && !!previousExamId,
  });

  const { data: criticalStudents } = useQuery({
    queryKey: ['analysis-critical', selectedExamId, lineType, range],
    queryFn: async () => {
      if (!selectedExamId) return null;
      const res = await analysisApi.getCriticalStudents({
        examId: selectedExamId,
        lineType: lineType || undefined,
        range,
      });
      return res.data;
    },
    enabled: !!selectedExamId,
  });

  const { data: subjectBalance } = useQuery({
    queryKey: ['analysis-balance', selectedExamId, selectedClassId, threshold],
    queryFn: async () => {
      if (!selectedExamId) return null;
      const res = await analysisApi.getSubjectBalance({
        examId: selectedExamId,
        classId: selectedClassId || undefined,
        threshold,
      });
      return res.data;
    },
    enabled: !!selectedExamId,
  });

  const { data: radarData } = useQuery({
    queryKey: ['analysis-radar', selectedExamId, selectedClassId],
    queryFn: async () => {
      if (!selectedExamId) return null;
      const res = await analysisApi.getRadarData({
        examId: selectedExamId,
        classId: selectedClassId || undefined,
      });
      return res.data;
    },
    enabled: !!selectedExamId,
  });

  const handleExport = () => {
    if (!statistics) return;
    const data = statistics.fullRankingList || statistics.rankingList || [];
    const headers = statistics.mode === 'total' 
      ? ['排名', '学号', '姓名', '班级', '总分']
      : ['排名', '学号', '姓名', '班级', '分数'];
    
    const csvContent = [
      headers.join(','),
      ...data.map((item: any) => [
        item.rank,
        item.studentNo,
        item.name,
        item.className,
        statistics.mode === 'total' ? item.totalScore : item.score,
      ].join(',')),
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${statistics.exam.name}_${statistics.mode === 'total' ? '总分' : statistics.subject?.name}_排名.csv`;
    link.click();
  };

  if (!isAdmin) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <BarChart3 className="w-16 h-16 text-ds-fg-muted mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-ds-fg mb-2">权限不足</h2>
          <p className="text-ds-fg-muted">只有管理员可以查看成绩分析</p>
        </div>
      </div>
    );
  }

  const isTotalMode = !selectedSubjectId;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ds-fg">成绩分析</h1>
          <p className="text-sm text-ds-fg-muted mt-1">多维度成绩数据分析</p>
        </div>
        {statistics && (
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 border border-ds-border rounded-md hover:bg-ds-surface-2 text-ds-fg transition-colors"
          >
            <Download className="w-4 h-4" />
            导出排名
          </button>
        )}
      </div>

      <div className="surface-card border border-ds-border rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-ds-fg mb-1">选择考试</label>
            <select
              value={selectedExamId}
              onChange={(e) => {
                setSelectedExamId(e.target.value);
                setSelectedSubjectId('');
                setSelectedClassId('');
              }}
              className="w-full px-3 py-2 border border-ds-border rounded-md bg-ds-surface text-ds-fg focus:outline-none focus:ring-2 focus:ring-ds-primary/50"
            >
              <option value="">请选择考试</option>
              {exams?.map((exam: any) => (
                <option key={exam.id} value={exam.id}>{exam.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-ds-fg mb-1">科目（可选）</label>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="w-full px-3 py-2 border border-ds-border rounded-md bg-ds-surface text-ds-fg focus:outline-none focus:ring-2 focus:ring-ds-primary/50"
              disabled={!selectedExamId}
            >
              <option value="">全部科目（总分）</option>
              {selectedExam?.exam_subjects?.map((es: any) => (
                <option key={es.subjectId} value={es.subjectId}>{es.subjects.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-ds-fg mb-1">班级（可选）</label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full px-3 py-2 border border-ds-border rounded-md bg-ds-surface text-ds-fg focus:outline-none focus:ring-2 focus:ring-ds-primary/50"
              disabled={!selectedExamId}
            >
              <option value="">全部班级</option>
              {classes?.map((cls: any) => (
                <option key={cls.id} value={cls.id}>{cls.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setSelectedExamId('');
                setSelectedSubjectId('');
                setSelectedClassId('');
              }}
              className="px-4 py-2 border border-ds-border rounded-md hover:bg-ds-surface-2 text-ds-fg transition-colors"
            >
              重置
            </button>
          </div>
        </div>
      </div>

      {!selectedExamId ? (
        <div className="text-center py-12">
          <BarChart3 className="w-16 h-16 text-ds-fg-muted mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-ds-fg mb-2">请选择考试</h2>
          <p className="text-ds-fg-muted">选择一个考试开始分析</p>
        </div>
      ) : (
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5 lg:w-[600px]">
            <TabsTrigger value="overview">基础统计</TabsTrigger>
            <TabsTrigger value="comparison">班级对比</TabsTrigger>
            <TabsTrigger value="progress">进退步</TabsTrigger>
            <TabsTrigger value="critical">临界生</TabsTrigger>
            <TabsTrigger value="balance">学科均衡</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {statistics && (
              <>
                {/* 数据卡片 */}
                <div className={`grid gap-3 ${statistics.mode === 'subject' ? 'grid-cols-2 md:grid-cols-4 lg:grid-cols-7' : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6'}`}>
                  <div className="surface-card border border-ds-border rounded-lg p-3">
                    <div className="text-xs text-ds-fg-muted">总人数</div>
                    <div className="text-xl font-bold text-ds-fg">{statistics.total}</div>
                  </div>
                  <div className="surface-card border border-ds-border rounded-lg p-3">
                    <div className="text-xs text-ds-fg-muted">缺考人数</div>
                    <div className="text-xl font-bold text-ds-warning">{statistics.absentCount || 0}</div>
                  </div>
                  <div className="surface-card border border-ds-border rounded-lg p-3">
                    <div className="text-xs text-ds-fg-muted">平均分</div>
                    <div className="text-xl font-bold text-ds-fg">{statistics.statistics?.average || '-'}</div>
                  </div>
                  <div className="surface-card border border-ds-border rounded-lg p-3">
                    <div className="text-xs text-ds-fg-muted">最高分</div>
                    <div className="text-xl font-bold text-ds-success">{statistics.statistics?.max || '-'}</div>
                  </div>
                  <div className="surface-card border border-ds-border rounded-lg p-3">
                    <div className="text-xs text-ds-fg-muted">最低分</div>
                    <div className="text-xl font-bold text-ds-danger">{statistics.statistics?.min || '-'}</div>
                  </div>
                  {statistics.mode === 'subject' && (
                    <>
                      <div className="surface-card border border-ds-border rounded-lg p-3">
                        <div className="text-xs text-ds-fg-muted">优秀率</div>
                        <div className="text-xl font-bold text-ds-success">{statistics.statistics?.excellentRate || 0}%</div>
                      </div>
                      <div className="surface-card border border-ds-border rounded-lg p-3">
                        <div className="text-xs text-ds-fg-muted">及格率</div>
                        <div className="text-xl font-bold text-ds-primary">{statistics.statistics?.passRate || 0}%</div>
                      </div>
                    </>
                  )}
                </div>

                {/* 总分模式：线位分布 */}
                {statistics.mode === 'total' && statistics.lineDistribution && (
                  <div className="surface-card border border-ds-border rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-ds-fg mb-4">线位分布</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {statistics.lineDistribution.map((line: any) => (
                        <div key={line.name} className="p-4 bg-ds-surface-2 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-ds-fg">{line.name}</span>
                            <span className="text-sm text-ds-fg-muted">{line.value}分</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-ds-success">{line.aboveCount}</div>
                              <div className="text-xs text-ds-fg-muted">线上 ({line.aboveRate}%)</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-ds-danger">{line.belowCount}</div>
                              <div className="text-xs text-ds-fg-muted">线下</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 科目模式：分数段分布 */}
                {statistics.mode === 'subject' && statistics.segments && (
                  <div className="surface-card border border-ds-border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-ds-fg">分数段分布</h3>
                      <div className="text-sm text-ds-fg-muted">
                        满分{statistics.maxScore}分 | 优秀线{statistics.scoreLines?.excellent}分 | 良好线{statistics.scoreLines?.good}分 | 及格线{statistics.scoreLines?.pass}分
                      </div>
                    </div>
                    <div className="space-y-3">
                      {statistics.segments.map((seg: any, index: number) => {
                        // 计算区间显示
                        const nextThreshold = index < statistics.segments.length - 1 ? statistics.segments[index + 1].threshold : 0;
                        let rangeText = '';
                        if (seg.label === '优秀') {
                          rangeText = `≥${seg.threshold}分`;
                        } else if (seg.label === '不及格') {
                          rangeText = `<${seg.threshold === 0 ? statistics.scoreLines?.pass || 60 : seg.threshold}分`;
                        } else {
                          rangeText = `${nextThreshold}分 ~ ${seg.threshold - 1}分`;
                        }
                        return (
                          <div key={seg.label} className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="text-ds-fg">{seg.label} ({rangeText})</span>
                              <span className="text-ds-fg-muted">{seg.count}人 ({seg.percentage}%)</span>
                            </div>
                            <div className="w-full bg-ds-surface-2 rounded-full h-3 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  seg.label === '优秀' ? 'bg-ds-success' :
                                  seg.label === '良好' ? 'bg-ds-primary' :
                                  seg.label === '及格' ? 'bg-ds-warning' : 'bg-ds-danger'
                                }`}
                                style={{ width: `${seg.percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* 统计指标 */}
                    <div className="mt-6 pt-4 border-t border-ds-border">
                      <h4 className="text-sm font-medium text-ds-fg mb-3">统计指标</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-3 bg-ds-surface-2 rounded-lg text-center">
                          <div className="text-xs text-ds-fg-muted">优秀人数</div>
                          <div className="text-xl font-bold text-ds-success">{statistics.excellentCount}</div>
                        </div>
                        <div className="p-3 bg-ds-surface-2 rounded-lg text-center">
                          <div className="text-xs text-ds-fg-muted">良好人数</div>
                          <div className="text-xl font-bold text-ds-primary">{statistics.goodCount}</div>
                        </div>
                        <div className="p-3 bg-ds-surface-2 rounded-lg text-center">
                          <div className="text-xs text-ds-fg-muted">及格人数</div>
                          <div className="text-xl font-bold text-ds-warning">{statistics.passCount}</div>
                        </div>
                        <div className="p-3 bg-ds-surface-2 rounded-lg text-center">
                          <div className="text-xs text-ds-fg-muted">不及格人数</div>
                          <div className="text-xl font-bold text-ds-danger">{statistics.failCount}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 排名列表预览 */}
                <div className="surface-card border border-ds-border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-ds-fg">
                      {statistics.mode === 'total' ? '总分排名' : `${statistics.subject?.name}排名`} (前10名)
                    </h3>
                    <button
                      onClick={() => setShowRankingModal(true)}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm border border-ds-border rounded-md hover:bg-ds-surface-2 text-ds-fg transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      查看详细情况
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-ds-surface">
                        <tr>
                          <th className="px-4 py-2 text-left text-sm font-medium text-ds-fg">排名</th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-ds-fg">学号</th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-ds-fg">姓名</th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-ds-fg">班级</th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-ds-fg">
                            {statistics.mode === 'total' ? '总分' : '分数'}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {statistics.rankingList?.slice(0, 10).map((item: any) => (
                          <tr key={item.studentId} className="border-t border-ds-border">
                            <td className="px-4 py-2 text-sm font-medium text-ds-fg">{item.rank}</td>
                            <td className="px-4 py-2 text-sm text-ds-fg-muted">{item.studentNo}</td>
                            <td className="px-4 py-2 text-sm font-medium text-ds-fg">{item.name}</td>
                            <td className="px-4 py-2 text-sm text-ds-fg-muted">{item.className}</td>
                            <td className="px-4 py-2 text-sm font-bold text-ds-fg">
                              {statistics.mode === 'total' ? item.totalScore : item.score}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="comparison" className="space-y-4">
            {classComparison && (
              <div className="surface-card border border-ds-border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-ds-surface">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-ds-fg">排名</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-ds-fg">班级</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-ds-fg">人数</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-ds-fg">平均分</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-ds-fg">最高分</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-ds-fg">最低分</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classComparison.classes?.map((cls: any, index: number) => (
                      <tr key={cls.classId} className="border-t border-ds-border hover:bg-ds-surface-2/50 transition-colors">
                        <td className="px-4 py-3 text-sm font-medium text-ds-fg">{index + 1}</td>
                        <td className="px-4 py-3 text-sm font-medium text-ds-fg">{cls.className}</td>
                        <td className="px-4 py-3 text-sm text-ds-fg-muted">{cls.total}</td>
                        <td className="px-4 py-3 text-sm font-medium text-ds-fg">{cls.average}</td>
                        <td className="px-4 py-3 text-sm text-ds-success">{cls.max}</td>
                        <td className="px-4 py-3 text-sm text-ds-danger">{cls.min}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="progress" className="space-y-4">
            <div className="surface-card border border-ds-border rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-ds-fg mb-1">对比考试</label>
                  <select
                    value={previousExamId}
                    onChange={(e) => setPreviousExamId(e.target.value)}
                    className="w-full px-3 py-2 border border-ds-border rounded-md bg-ds-surface text-ds-fg focus:outline-none focus:ring-2 focus:ring-ds-primary/50"
                  >
                    <option value="">请选择对比考试</option>
                    {exams?.filter((e: any) => e.id !== selectedExamId).map((exam: any) => (
                      <option key={exam.id} value={exam.id}>{exam.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {!previousExamId ? (
              <div className="text-center py-8 text-ds-fg-muted">
                请选择对比考试查看进退步分析
              </div>
            ) : progress && (
              <div className="surface-card border border-ds-border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-ds-surface">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-ds-fg">学号</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-ds-fg">姓名</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-ds-fg">班级</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-ds-fg">当前排名</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-ds-fg">上次排名</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-ds-fg">变化</th>
                    </tr>
                  </thead>
                  <tbody>
                    {progress.students?.map((s: any) => (
                      <tr key={s.studentId} className="border-t border-ds-border hover:bg-ds-surface-2/50 transition-colors">
                        <td className="px-4 py-3 text-sm text-ds-fg-muted">{s.studentNo}</td>
                        <td className="px-4 py-3 text-sm font-medium text-ds-fg">{s.name}</td>
                        <td className="px-4 py-3 text-sm text-ds-fg-muted">{s.className}</td>
                        <td className="px-4 py-3 text-sm text-ds-fg">{s.currentRank}</td>
                        <td className="px-4 py-3 text-sm text-ds-fg-muted">{s.previousRank || '-'}</td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex items-center gap-1">
                            {s.progress === 'up' && (
                              <>
                                <TrendingUp className="w-4 h-4 text-ds-success" />
                                <span className="text-ds-success">+{s.rankChange}</span>
                              </>
                            )}
                            {s.progress === 'down' && (
                              <>
                                <TrendingDown className="w-4 h-4 text-ds-danger" />
                                <span className="text-ds-danger">{s.rankChange}</span>
                              </>
                            )}
                            {s.progress === 'stable' && (
                              <>
                                <Minus className="w-4 h-4 text-ds-fg-muted" />
                                <span className="text-ds-fg-muted">0</span>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="critical" className="space-y-4">
            <div className="surface-card border border-ds-border rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-ds-fg mb-1">线位类型</label>
                  <select
                    value={lineType}
                    onChange={(e) => setLineType(e.target.value)}
                    className="w-full px-3 py-2 border border-ds-border rounded-md bg-ds-surface text-ds-fg focus:outline-none focus:ring-2 focus:ring-ds-primary/50"
                  >
                    <option value="">全部线位</option>
                    <option value="ONE_BOOK">一本线</option>
                    <option value="REGULAR">普高线</option>
                    <option value="CUSTOM">自定义线</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-ds-fg mb-1">浮动范围（分）</label>
                  <input
                    type="number"
                    value={range}
                    onChange={(e) => setRange(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-ds-border rounded-md bg-ds-surface text-ds-fg focus:outline-none focus:ring-2 focus:ring-ds-primary/50"
                    min="1"
                    max="50"
                  />
                </div>
              </div>
            </div>

            {criticalStudents && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {criticalStudents.lines?.map((line: any) => (
                    <div key={line.name} className="surface-card border border-ds-border rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="w-5 h-5 text-ds-primary" />
                        <span className="font-semibold text-ds-fg">{line.name}</span>
                      </div>
                      <div className="text-2xl font-bold text-ds-fg">{line.value}分</div>
                    </div>
                  ))}
                </div>

                <div className="surface-card border border-ds-border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-ds-surface">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-ds-fg">学号</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-ds-fg">姓名</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-ds-fg">班级</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-ds-fg">总分</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-ds-fg">临界线</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-ds-fg">距离</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-ds-fg">状态</th>
                      </tr>
                    </thead>
                    <tbody>
                      {criticalStudents.students?.map((s: any) => (
                        <tr key={`${s.studentId}-${s.lineName}`} className="border-t border-ds-border hover:bg-ds-surface-2/50 transition-colors">
                          <td className="px-4 py-3 text-sm text-ds-fg-muted">{s.studentNo}</td>
                          <td className="px-4 py-3 text-sm font-medium text-ds-fg">{s.name}</td>
                          <td className="px-4 py-3 text-sm text-ds-fg-muted">{s.className}</td>
                          <td className="px-4 py-3 text-sm font-medium text-ds-fg">{s.totalScore}</td>
                          <td className="px-4 py-3 text-sm text-ds-fg-muted">{s.lineName}</td>
                          <td className="px-4 py-3 text-sm">
                            <span className={s.position === 'above' ? 'text-ds-success' : 'text-ds-danger'}>
                              {s.distance > 0 ? '+' : ''}{s.distance}分
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${
                              s.position === 'above' ? 'bg-ds-success/20 text-ds-success' : 'bg-ds-danger/20 text-ds-danger'
                            }`}>
                              {s.position === 'above' ? '线上' : '线下'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="balance" className="space-y-4">
            <div className="surface-card border border-ds-border rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-ds-fg mb-1">偏科阈值（排名差异百分比）</label>
                  <input
                    type="number"
                    value={threshold}
                    onChange={(e) => setThreshold(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-ds-border rounded-md bg-ds-surface text-ds-fg focus:outline-none focus:ring-2 focus:ring-ds-primary/50"
                    min="5"
                    max="50"
                  />
                </div>
              </div>
            </div>

            {subjectBalance && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="surface-card border border-ds-border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-5 h-5 text-ds-primary" />
                      <span className="text-sm text-ds-fg-muted">总人数</span>
                    </div>
                    <div className="text-2xl font-bold text-ds-fg">{subjectBalance.totalStudents}</div>
                  </div>
                  <div className="surface-card border border-ds-border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-5 h-5 text-ds-warning" />
                      <span className="text-sm text-ds-fg-muted">偏科人数</span>
                    </div>
                    <div className="text-2xl font-bold text-ds-warning">{subjectBalance.imbalancedCount}</div>
                  </div>
                  <div className="surface-card border border-ds-border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <BarChart3 className="w-5 h-5 text-ds-primary" />
                      <span className="text-sm text-ds-fg-muted">偏科比例</span>
                    </div>
                    <div className="text-2xl font-bold text-ds-fg">
                      {subjectBalance.totalStudents > 0 
                        ? Math.round((subjectBalance.imbalancedCount / subjectBalance.totalStudents) * 100) 
                        : 0}%
                    </div>
                  </div>
                </div>

                {radarData && (
                  <div className="surface-card border border-ds-border rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-ds-fg mb-4">各科平均分占比</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {radarData.radarData?.map((item: any) => (
                        <div key={item.subjectId} className="text-center">
                          <div className="text-sm text-ds-fg-muted mb-1">{item.subject}</div>
                          <div className="text-xl font-bold text-ds-fg">{item.percentage}%</div>
                          <div className="text-xs text-ds-fg-muted">均分: {item.average}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="surface-card border border-ds-border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-ds-surface">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-ds-fg">学号</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-ds-fg">姓名</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-ds-fg">班级</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-ds-fg">平均百分位</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-ds-fg">弱势学科</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-ds-fg">优势学科</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subjectBalance.students?.filter((s: any) => s.isImbalanced).map((s: any) => (
                        <tr key={s.studentId} className="border-t border-ds-border hover:bg-ds-surface-2/50 transition-colors">
                          <td className="px-4 py-3 text-sm text-ds-fg-muted">{s.studentNo}</td>
                          <td className="px-4 py-3 text-sm font-medium text-ds-fg">{s.name}</td>
                          <td className="px-4 py-3 text-sm text-ds-fg-muted">{s.className}</td>
                          <td className="px-4 py-3 text-sm text-ds-fg">{s.averagePercentile}%</td>
                          <td className="px-4 py-3 text-sm">
                            {s.imbalancedSubjects?.filter((sub: any) => sub.type === 'weak').map((sub: any) => (
                              <span key={sub.subjectId} className="inline-block mr-1 px-2 py-0.5 rounded text-xs bg-ds-danger/20 text-ds-danger">
                                {sub.subjectName} ({sub.percentile}%)
                              </span>
                            ))}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {s.imbalancedSubjects?.filter((sub: any) => sub.type === 'strong').map((sub: any) => (
                              <span key={sub.subjectId} className="inline-block mr-1 px-2 py-0.5 rounded text-xs bg-ds-success/20 text-ds-success">
                                {sub.subjectName} ({sub.percentile}%)
                              </span>
                            ))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* 排名详情弹窗 */}
      <Modal
        isOpen={showRankingModal}
        onClose={() => setShowRankingModal(false)}
        title={`${statistics?.mode === 'total' ? '总分排名' : `${statistics?.subject?.name}排名`} - 详细列表`}
        className="max-w-4xl max-h-[80vh] overflow-y-auto"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-ds-surface">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-ds-fg">排名</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-ds-fg">学号</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-ds-fg">姓名</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-ds-fg">班级</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-ds-fg">
                  {statistics?.mode === 'total' ? '总分' : '分数'}
                </th>
              </tr>
            </thead>
            <tbody>
              {statistics?.fullRankingList?.map((item: any) => (
                <tr key={item.studentId} className="border-t border-ds-border">
                  <td className="px-4 py-3 text-sm font-medium text-ds-fg">{item.rank}</td>
                  <td className="px-4 py-3 text-sm text-ds-fg-muted">{item.studentNo}</td>
                  <td className="px-4 py-3 text-sm font-medium text-ds-fg">{item.name}</td>
                  <td className="px-4 py-3 text-sm text-ds-fg-muted">{item.className}</td>
                  <td className="px-4 py-3 text-sm font-bold text-ds-fg">
                    {statistics.mode === 'total' ? item.totalScore : item.score}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Modal>
    </div>
  );
}
