import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { examsApi, scoresApi, gradesApi, subjectsApi, classesApi, studentsApi } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import {
  FileText,
  Plus,
  Edit2,
  Trash2,
  X,
  ChevronRight,
  Upload,
  BarChart3,
  Users,
  Check,
  Eye,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Exam {
  id: string;
  name: string;
  type: string;
  term: string;
  schoolYear: string;
  gradeId: string;
  status: string;
  createdAt: string;
  grades?: { id: string; name: string };
  exam_subjects?: {
    id: string;
    subjectId: string;
    maxScore: number;
    weight: number;
    isStat: boolean;
    subjects: { id: string; name: string; code: string };
  }[];
  _count?: { scores: number };
}

interface Score {
  id: string;
  studentId: string;
  examId: string;
  subjectId: string;
  rawScore: number;
  assignedScore: number | null;
  classRank: number | null;
  gradeRank: number | null;
  isAbsent: boolean;
  students: {
    id: string;
    studentNo: string;
    users: { name: string };
    classes: { id: string; name: string };
    grades: { id: string; name: string };
  };
  exam_subjects: {
    maxScore: number;
    subjects: { id: string; name: string };
  };
  exams: { id: string; name: string };
}

const examTypeMap: Record<string, string> = {
  monthly: '月考',
  midterm: '期中考试',
  final: '期末考试',
  mock: '模拟考试',
};

const examStatusMap: Record<string, { label: string; color: string }> = {
  draft: { label: '草稿', color: 'bg-ds-warning/20 text-ds-warning' },
  published: { label: '已发布', color: 'bg-ds-success/20 text-ds-success' },
  closed: { label: '已关闭', color: 'bg-ds-fg-muted/20 text-ds-fg-muted' },
};

export default function Exams() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SCHOOL_ADMIN';

  const [activeTab, setActiveTab] = useState('exams');
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [showExamModal, setShowExamModal] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [deleteExamConfirm, setDeleteExamConfirm] = useState<Exam | null>(null);
  const [examForm, setExamForm] = useState({
    name: '',
    type: 'midterm',
    term: '',
    schoolYear: '',
    gradeId: '',
    subjects: [] as { subjectId: string; maxScore: number; weight: number; isStat: boolean }[],
  });

  const [showScoreModal, setShowScoreModal] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [scoreData, setScoreData] = useState<{ studentId: string; studentNo: string; name: string; rawScore: number; isAbsent: boolean }[]>([]);

  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [analysisSubjectId, setAnalysisSubjectId] = useState<string>('');
  const [analysisClassId, setAnalysisClassId] = useState<string>('');

  const { data: grades } = useQuery({
    queryKey: ['grades'],
    queryFn: async () => {
      const res = await gradesApi.list();
      return res.data;
    },
  });

  const { data: subjects } = useQuery({
    queryKey: ['subjects'],
    queryFn: async () => {
      const res = await subjectsApi.list();
      return res.data;
    },
  });

  const { data: exams } = useQuery<Exam[]>({
    queryKey: ['exams'],
    queryFn: async () => {
      const res = await examsApi.list();
      return res.data;
    },
    enabled: isAdmin,
  });

  const { data: scores } = useQuery<Score[]>({
    queryKey: ['scores', selectedExam?.id],
    queryFn: async () => {
      if (!selectedExam) return [];
      const res = await scoresApi.list({ examId: selectedExam.id });
      return res.data;
    },
    enabled: !!selectedExam,
  });

  const { data: analysis } = useQuery({
    queryKey: ['scoreAnalysis', selectedExam?.id, analysisSubjectId, analysisClassId],
    queryFn: async () => {
      if (!selectedExam) return null;
      const res = await scoresApi.getAnalysis({
        examId: selectedExam.id,
        subjectId: analysisSubjectId || undefined,
        classId: analysisClassId || undefined,
      });
      return res.data;
    },
    enabled: !!selectedExam && showAnalysisModal,
  });

  const { data: classes } = useQuery({
    queryKey: ['classes', selectedExam?.gradeId],
    queryFn: async () => {
      if (!selectedExam?.gradeId) return [];
      const res = await classesApi.list({ gradeId: selectedExam.gradeId });
      return res.data;
    },
    enabled: !!selectedExam?.gradeId,
  });

  const createExamMutation = useMutation({
    mutationFn: (data: typeof examForm) => examsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams'] });
      setShowExamModal(false);
      resetExamForm();
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || '创建失败');
    },
  });

  const updateExamMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<typeof examForm> }) =>
      examsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams'] });
      setShowExamModal(false);
      setEditingExam(null);
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || '更新失败');
    },
  });

  const deleteExamMutation = useMutation({
    mutationFn: (id: string) => examsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams'] });
      setDeleteExamConfirm(null);
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || '删除失败');
    },
  });

  const publishExamMutation = useMutation({
    mutationFn: (id: string) => examsApi.publish(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams'] });
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || '发布失败');
    },
  });

  const batchScoreMutation = useMutation({
    mutationFn: (data: { examId: string; subjectId: string; scores: { studentId: string; rawScore: number; isAbsent: boolean }[] }) =>
      scoresApi.batchCreate(data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['scores', selectedExam?.id] });
      alert(`导入完成：成功 ${result.data.success} 条，失败 ${result.data.failed} 条`);
      setShowScoreModal(false);
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || '导入失败');
    },
  });

  const calculateRanksMutation = useMutation({
    mutationFn: (examId: string) => scoresApi.calculateRanks(examId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scores', selectedExam?.id] });
      alert('排名计算完成');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || '计算失败');
    },
  });

  const resetExamForm = () => {
    setExamForm({
      name: '',
      type: 'midterm',
      term: '',
      schoolYear: '',
      gradeId: '',
      subjects: [],
    });
  };

  const handleExamSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingExam) {
      updateExamMutation.mutate({ id: editingExam.id, data: examForm });
    } else {
      createExamMutation.mutate(examForm);
    }
  };

  const handleLoadStudents = async () => {
    if (!selectedExam?.gradeId) return;
    const res = await studentsApi.list({ gradeId: selectedExam.gradeId });
    const students = res.data;
    setScoreData(
      students.map((s: any) => ({
        studentId: s.id,
        studentNo: s.studentNo,
        name: s.user.name,
        rawScore: 0,
        isAbsent: false,
      }))
    );
  };

  const handleBatchImport = () => {
    if (!selectedExam || !selectedSubjectId) {
      alert('请选择科目');
      return;
    }
    batchScoreMutation.mutate({
      examId: selectedExam.id,
      subjectId: selectedSubjectId,
      scores: scoreData.map((s) => ({
        studentId: s.studentId,
        rawScore: s.rawScore,
        isAbsent: s.isAbsent,
      })),
    });
  };

  if (!isAdmin) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-ds-fg-muted mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-ds-fg mb-2">权限不足</h2>
          <p className="text-ds-fg-muted">只有管理员可以管理考务</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ds-fg">考务中心</h1>
          <p className="text-sm text-ds-fg-muted mt-1">管理考试和成绩</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 lg:w-[300px]">
          <TabsTrigger value="exams" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            考试管理
          </TabsTrigger>
          <TabsTrigger value="scores" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            成绩管理
          </TabsTrigger>
        </TabsList>

        <TabsContent value="exams" className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => {
                setEditingExam(null);
                resetExamForm();
                setShowExamModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-ds-primary text-ds-fg rounded-md hover:bg-ds-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              创建考试
            </button>
          </div>

          <div className="surface-card border border-ds-border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-ds-surface">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-ds-fg">考试名称</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-ds-fg">类型</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-ds-fg">年级</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-ds-fg">学期</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-ds-fg">状态</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-ds-fg">成绩数</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-ds-fg">操作</th>
                </tr>
              </thead>
              <tbody>
                {exams?.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-ds-fg-muted">
                      暂无考试数据
                    </td>
                  </tr>
                ) : (
                  exams?.map((exam) => (
                    <tr key={exam.id} className="border-t border-ds-border hover:bg-ds-surface-2/50 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-ds-fg">{exam.name}</td>
                      <td className="px-4 py-3 text-sm text-ds-fg-muted">{examTypeMap[exam.type] || exam.type}</td>
                      <td className="px-4 py-3 text-sm text-ds-fg-muted">{exam.grades?.name}</td>
                      <td className="px-4 py-3 text-sm text-ds-fg-muted">{exam.term}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${examStatusMap[exam.status]?.color || ''}`}>
                          {examStatusMap[exam.status]?.label || exam.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-ds-fg-muted">{exam._count?.scores || 0}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setSelectedExam(exam);
                              setActiveTab('scores');
                            }}
                            className="p-1.5 text-ds-fg-muted hover:text-ds-primary transition-colors"
                            title="查看成绩"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {exam.status === 'draft' && (
                            <>
                              <button
                                onClick={() => {
                                  setEditingExam(exam);
                                  setExamForm({
                                    name: exam.name,
                                    type: exam.type,
                                    term: exam.term,
                                    schoolYear: exam.schoolYear,
                                    gradeId: exam.gradeId,
                                    subjects: exam.exam_subjects?.map((es) => ({
                                      subjectId: es.subjectId,
                                      maxScore: es.maxScore,
                                      weight: es.weight,
                                      isStat: es.isStat,
                                    })) || [],
                                  });
                                  setShowExamModal(true);
                                }}
                                className="p-1.5 text-ds-fg-muted hover:text-ds-primary transition-colors"
                                title="编辑"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setDeleteExamConfirm(exam)}
                                className="p-1.5 text-ds-fg-muted hover:text-ds-danger transition-colors"
                                title="删除"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => publishExamMutation.mutate(exam.id)}
                                className="p-1.5 text-ds-fg-muted hover:text-ds-success transition-colors"
                                title="发布"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="scores" className="space-y-4">
          {!selectedExam ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-ds-fg-muted mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-ds-fg mb-2">请选择考试</h2>
              <p className="text-ds-fg-muted mb-4">从考试管理中选择一个考试查看成绩</p>
              <button
                onClick={() => setActiveTab('exams')}
                className="px-4 py-2 bg-ds-primary text-ds-fg rounded-md hover:bg-ds-primary/90 transition-colors"
              >
                前往考试管理
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedExam(null)}
                    className="text-ds-fg-muted hover:text-ds-fg transition-colors"
                  >
                    考试列表
                  </button>
                  <ChevronRight className="w-4 h-4 text-ds-fg-muted" />
                  <span className="text-ds-fg font-medium">{selectedExam.name}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedSubjectId('');
                      setScoreData([]);
                      setShowScoreModal(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-ds-primary text-ds-fg rounded-md hover:bg-ds-primary/90 transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    导入成绩
                  </button>
                  <button
                    onClick={() => {
                      setAnalysisSubjectId('');
                      setAnalysisClassId('');
                      setShowAnalysisModal(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 border border-ds-border text-ds-fg rounded-md hover:bg-ds-surface-2 transition-colors"
                  >
                    <BarChart3 className="w-4 h-4" />
                    成绩分析
                  </button>
                  <button
                    onClick={() => calculateRanksMutation.mutate(selectedExam.id)}
                    className="flex items-center gap-2 px-4 py-2 border border-ds-border text-ds-fg rounded-md hover:bg-ds-surface-2 transition-colors"
                  >
                    <Users className="w-4 h-4" />
                    计算排名
                  </button>
                </div>
              </div>

              <div className="surface-card border border-ds-border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-ds-surface">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-ds-fg">学号</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-ds-fg">姓名</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-ds-fg">班级</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-ds-fg">科目</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-ds-fg">分数</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-ds-fg">满分</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-ds-fg">班级排名</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-ds-fg">年级排名</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-ds-fg">状态</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scores?.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-4 py-8 text-center text-ds-fg-muted">
                          暂无成绩数据
                        </td>
                      </tr>
                    ) : (
                      scores?.map((score) => (
                        <tr key={score.id} className="border-t border-ds-border hover:bg-ds-surface-2/50 transition-colors">
                          <td className="px-4 py-3 text-sm text-ds-fg-muted">{score.students.studentNo}</td>
                          <td className="px-4 py-3 text-sm font-medium text-ds-fg">{score.students.users.name}</td>
                          <td className="px-4 py-3 text-sm text-ds-fg-muted">{score.students.classes?.name}</td>
                          <td className="px-4 py-3 text-sm text-ds-fg-muted">{score.exam_subjects.subjects.name}</td>
                          <td className="px-4 py-3 text-sm font-medium text-ds-fg">
                            {score.isAbsent ? '缺考' : score.rawScore}
                          </td>
                          <td className="px-4 py-3 text-sm text-ds-fg-muted">{score.exam_subjects.maxScore}</td>
                          <td className="px-4 py-3 text-sm text-ds-fg-muted">{score.classRank || '-'}</td>
                          <td className="px-4 py-3 text-sm text-ds-fg-muted">{score.gradeRank || '-'}</td>
                          <td className="px-4 py-3 text-sm">
                            {score.isAbsent ? (
                              <span className="text-ds-warning">缺考</span>
                            ) : (
                              <span className="text-ds-success">正常</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>

      {showExamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ds-overlay/50 backdrop-blur-sm">
          <div className="w-full max-w-lg glass-card p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-ds-fg">{editingExam ? '编辑考试' : '创建考试'}</h2>
              <button onClick={() => setShowExamModal(false)} className="text-ds-fg-muted hover:text-ds-fg transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleExamSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ds-fg mb-1">考试名称</label>
                <input
                  type="text"
                  value={examForm.name}
                  onChange={(e) => setExamForm({ ...examForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-ds-border rounded-md bg-ds-surface text-ds-fg focus:outline-none focus:ring-2 focus:ring-ds-primary/50"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ds-fg mb-1">考试类型</label>
                <select
                  value={examForm.type}
                  onChange={(e) => setExamForm({ ...examForm, type: e.target.value })}
                  className="w-full px-3 py-2 border border-ds-border rounded-md bg-ds-surface text-ds-fg focus:outline-none focus:ring-2 focus:ring-ds-primary/50"
                  required
                >
                  <option value="monthly">月考</option>
                  <option value="midterm">期中考试</option>
                  <option value="final">期末考试</option>
                  <option value="mock">模拟考试</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-ds-fg mb-1">学年</label>
                  <input
                    type="text"
                    value={examForm.schoolYear}
                    onChange={(e) => setExamForm({ ...examForm, schoolYear: e.target.value })}
                    placeholder="如: 2024-2025"
                    className="w-full px-3 py-2 border border-ds-border rounded-md bg-ds-surface text-ds-fg focus:outline-none focus:ring-2 focus:ring-ds-primary/50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ds-fg mb-1">学期</label>
                  <input
                    type="text"
                    value={examForm.term}
                    onChange={(e) => setExamForm({ ...examForm, term: e.target.value })}
                    placeholder="如: 2024-2025-1"
                    className="w-full px-3 py-2 border border-ds-border rounded-md bg-ds-surface text-ds-fg focus:outline-none focus:ring-2 focus:ring-ds-primary/50"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-ds-fg mb-1">年级</label>
                <select
                  value={examForm.gradeId}
                  onChange={(e) => setExamForm({ ...examForm, gradeId: e.target.value })}
                  className="w-full px-3 py-2 border border-ds-border rounded-md bg-ds-surface text-ds-fg focus:outline-none focus:ring-2 focus:ring-ds-primary/50"
                  required
                  disabled={!!editingExam}
                >
                  <option value="">请选择年级</option>
                  {grades?.map((grade: any) => (
                    <option key={grade.id} value={grade.id}>{grade.name}</option>
                  ))}
                </select>
              </div>
              {!editingExam && (
                <div>
                  <label className="block text-sm font-medium text-ds-fg mb-1">考试科目</label>
                  <div className="space-y-2">
                    {subjects?.map((subject: any) => (
                      <label key={subject.id} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={examForm.subjects.some((s) => s.subjectId === subject.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setExamForm({
                                ...examForm,
                                subjects: [
                                  ...examForm.subjects,
                                  { subjectId: subject.id, maxScore: 100, weight: 1, isStat: true },
                                ],
                              });
                            } else {
                              setExamForm({
                                ...examForm,
                                subjects: examForm.subjects.filter((s) => s.subjectId !== subject.id),
                              });
                            }
                          }}
                          className="rounded border-ds-border"
                        />
                        <span className="text-sm text-ds-fg">{subject.name}</span>
                        {examForm.subjects.some((s) => s.subjectId === subject.id) && (
                          <input
                            type="number"
                            value={examForm.subjects.find((s) => s.subjectId === subject.id)?.maxScore || 100}
                            onChange={(e) => {
                              setExamForm({
                                ...examForm,
                                subjects: examForm.subjects.map((s) =>
                                  s.subjectId === subject.id ? { ...s, maxScore: Number(e.target.value) } : s
                                ),
                              });
                            }}
                            className="w-20 px-2 py-1 border border-ds-border rounded text-sm"
                            min="1"
                          />
                        )}
                      </label>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowExamModal(false)}
                  className="flex-1 px-4 py-2 border border-ds-border rounded-md hover:bg-ds-surface-2 text-ds-fg transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={createExamMutation.isPending || updateExamMutation.isPending}
                  className="flex-1 px-4 py-2 bg-ds-primary text-ds-fg rounded-md hover:bg-ds-primary/90 disabled:opacity-50 transition-colors"
                >
                  {createExamMutation.isPending || updateExamMutation.isPending ? '保存中...' : '保存'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showScoreModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ds-overlay/50 backdrop-blur-sm">
          <div className="w-full max-w-4xl glass-card p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-ds-fg">导入成绩 - {selectedExam?.name}</h2>
              <button onClick={() => setShowScoreModal(false)} className="text-ds-fg-muted hover:text-ds-fg transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ds-fg mb-1">选择科目</label>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="w-full px-3 py-2 border border-ds-border rounded-md bg-ds-surface text-ds-fg focus:outline-none focus:ring-2 focus:ring-ds-primary/50"
                >
                  <option value="">请选择科目</option>
                  {selectedExam?.exam_subjects?.map((es) => (
                    <option key={es.subjectId} value={es.subjectId}>
                      {es.subjects.name} (满分 {es.maxScore})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleLoadStudents}
                  className="px-4 py-2 border border-ds-border rounded-md hover:bg-ds-surface-2 text-ds-fg transition-colors"
                >
                  加载学生名单
                </button>
              </div>
              {scoreData.length > 0 && (
                <div className="border border-ds-border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-ds-surface">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-ds-fg">学号</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-ds-fg">姓名</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-ds-fg">分数</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-ds-fg">缺考</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scoreData.map((s, index) => (
                        <tr key={s.studentId} className="border-t border-ds-border">
                          <td className="px-4 py-2 text-sm text-ds-fg-muted">{s.studentNo}</td>
                          <td className="px-4 py-2 text-sm text-ds-fg">{s.name}</td>
                          <td className="px-4 py-2">
                            <input
                              type="number"
                              value={s.rawScore}
                              onChange={(e) => {
                                const newData = [...scoreData];
                                newData[index].rawScore = Number(e.target.value);
                                setScoreData(newData);
                              }}
                              className="w-20 px-2 py-1 border border-ds-border rounded text-sm"
                              min="0"
                              disabled={s.isAbsent}
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="checkbox"
                              checked={s.isAbsent}
                              onChange={(e) => {
                                const newData = [...scoreData];
                                newData[index].isAbsent = e.target.checked;
                                if (e.target.checked) {
                                  newData[index].rawScore = 0;
                                }
                                setScoreData(newData);
                              }}
                              className="rounded border-ds-border"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowScoreModal(false)}
                  className="flex-1 px-4 py-2 border border-ds-border rounded-md hover:bg-ds-surface-2 text-ds-fg transition-colors"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={handleBatchImport}
                  disabled={batchScoreMutation.isPending || !selectedSubjectId || scoreData.length === 0}
                  className="flex-1 px-4 py-2 bg-ds-primary text-ds-fg rounded-md hover:bg-ds-primary/90 disabled:opacity-50 transition-colors"
                >
                  {batchScoreMutation.isPending ? '导入中...' : '确认导入'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAnalysisModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ds-overlay/50 backdrop-blur-sm">
          <div className="w-full max-w-2xl glass-card p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-ds-fg">成绩分析 - {selectedExam?.name}</h2>
              <button onClick={() => setShowAnalysisModal(false)} className="text-ds-fg-muted hover:text-ds-fg transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-ds-fg mb-1">科目（可选）</label>
                  <select
                    value={analysisSubjectId}
                    onChange={(e) => setAnalysisSubjectId(e.target.value)}
                    className="w-full px-3 py-2 border border-ds-border rounded-md bg-ds-surface text-ds-fg focus:outline-none focus:ring-2 focus:ring-ds-primary/50"
                  >
                    <option value="">全部科目</option>
                    {selectedExam?.exam_subjects?.map((es) => (
                      <option key={es.subjectId} value={es.subjectId}>{es.subjects.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-ds-fg mb-1">班级（可选）</label>
                  <select
                    value={analysisClassId}
                    onChange={(e) => setAnalysisClassId(e.target.value)}
                    className="w-full px-3 py-2 border border-ds-border rounded-md bg-ds-surface text-ds-fg focus:outline-none focus:ring-2 focus:ring-ds-primary/50"
                  >
                    <option value="">全部班级</option>
                    {classes?.map((cls: any) => (
                      <option key={cls.id} value={cls.id}>{cls.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {analysis && (
                <div className="space-y-4">
                  <div className="grid grid-cols-4 gap-4">
                    <div className="p-4 bg-ds-surface-2 rounded-lg">
                      <div className="text-sm text-ds-fg-muted">总人数</div>
                      <div className="text-2xl font-bold text-ds-fg">{analysis.total}</div>
                    </div>
                    <div className="p-4 bg-ds-surface-2 rounded-lg">
                      <div className="text-sm text-ds-fg-muted">平均分</div>
                      <div className="text-2xl font-bold text-ds-fg">{analysis.average}</div>
                    </div>
                    <div className="p-4 bg-ds-surface-2 rounded-lg">
                      <div className="text-sm text-ds-fg-muted">最高分</div>
                      <div className="text-2xl font-bold text-ds-fg">{analysis.max}</div>
                    </div>
                    <div className="p-4 bg-ds-surface-2 rounded-lg">
                      <div className="text-sm text-ds-fg-muted">最低分</div>
                      <div className="text-2xl font-bold text-ds-fg">{analysis.min}</div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-ds-fg mb-2">分数段分布</h3>
                    <div className="space-y-2">
                      {analysis.distribution?.map((seg: any) => (
                        <div key={seg.label} className="flex items-center gap-2">
                          <span className="w-16 text-sm text-ds-fg-muted">{seg.label}</span>
                          <div className="flex-1 bg-ds-surface-2 rounded-full h-4 overflow-hidden">
                            <div
                              className="h-full bg-ds-primary rounded-full"
                              style={{ width: `${analysis.total > 0 ? (seg.count / analysis.total) * 100 : 0}%` }}
                            />
                          </div>
                          <span className="w-12 text-sm text-ds-fg-muted text-right">{seg.count}人</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {analysis.classStats && analysis.classStats.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-ds-fg mb-2">班级统计</h3>
                      <div className="border border-ds-border rounded-lg overflow-hidden">
                        <table className="w-full">
                          <thead className="bg-ds-surface">
                            <tr>
                              <th className="px-4 py-2 text-left text-sm font-medium text-ds-fg">班级</th>
                              <th className="px-4 py-2 text-left text-sm font-medium text-ds-fg">人数</th>
                              <th className="px-4 py-2 text-left text-sm font-medium text-ds-fg">平均分</th>
                              <th className="px-4 py-2 text-left text-sm font-medium text-ds-fg">最高分</th>
                              <th className="px-4 py-2 text-left text-sm font-medium text-ds-fg">最低分</th>
                            </tr>
                          </thead>
                          <tbody>
                            {analysis.classStats.map((cls: any) => (
                              <tr key={cls.classId} className="border-t border-ds-border">
                                <td className="px-4 py-2 text-sm text-ds-fg">{cls.className}</td>
                                <td className="px-4 py-2 text-sm text-ds-fg-muted">{cls.count}</td>
                                <td className="px-4 py-2 text-sm text-ds-fg">{Math.round(cls.average * 100) / 100}</td>
                                <td className="px-4 py-2 text-sm text-ds-fg">{cls.max}</td>
                                <td className="px-4 py-2 text-sm text-ds-fg">{cls.min}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowAnalysisModal(false)}
                  className="px-4 py-2 border border-ds-border rounded-md hover:bg-ds-surface-2 text-ds-fg transition-colors"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <AlertDialog open={!!deleteExamConfirm} onOpenChange={() => setDeleteExamConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除考试「{deleteExamConfirm?.name}」吗？此操作不可撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteExamConfirm && deleteExamMutation.mutate(deleteExamConfirm.id)}>
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
