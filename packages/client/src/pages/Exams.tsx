import { useState, useRef, useCallback } from 'react';
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
  Copy,
  Calendar,
  Clock,
  Download,
  AlertCircle,
  FileSpreadsheet,
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
  startTime?: string;
  endTime?: string;
  createdAt: string;
  grades?: { id: string; name: string };
  exam_subjects?: {
    id: string;
    subjectId: string;
    maxScore: number;
    excellentLine?: number;
    passLine?: number;
    lowLine?: number;
    weight: number;
    includeInTotal: boolean;
    includeInRank: boolean;
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
  weekly: '周测',
  unit: '单元测',
};

const examStatusMap: Record<string, { label: string; color: string }> = {
  draft: { label: '草稿', color: 'bg-ds-warning/20 text-ds-warning' },
  pending: { label: '未开始', color: 'bg-blue-500/20 text-blue-500' },
  ongoing: { label: '进行中', color: 'bg-ds-success/20 text-ds-success' },
  ended: { label: '已结束', color: 'bg-purple-500/20 text-purple-500' },
  archived: { label: '已归档', color: 'bg-ds-fg-muted/20 text-ds-fg-muted' },
};

const statusFlow = ['draft', 'pending', 'ongoing', 'ended', 'archived'];
const nextStatusMap: Record<string, string> = {
  draft: 'pending',
  pending: 'ongoing',
  ongoing: 'ended',
  ended: 'archived',
  archived: '',
};

const statusActionMap: Record<string, string> = {
  draft: '发布',
  pending: '开始考试',
  ongoing: '结束考试',
  ended: '归档',
  archived: '',
};

export default function Exams() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SCHOOL_ADMIN';
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState('exams');
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [showExamModal, setShowExamModal] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [deleteExamConfirm, setDeleteExamConfirm] = useState<Exam | null>(null);
  const [copyExamConfirm, setCopyExamConfirm] = useState<Exam | null>(null);
  const [copyExamName, setCopyExamName] = useState('');
  const [examForm, setExamForm] = useState({
    name: '',
    type: 'midterm',
    term: '',
    schoolYear: '',
    gradeId: '',
    startTime: '',
    endTime: '',
    subjects: [] as {
      subjectId: string;
      maxScore: number;
      excellentLine: number;
      passLine: number;
      lowLine: number;
      weight: number;
      includeInTotal: boolean;
      includeInRank: boolean;
    }[],
  });

  // 成绩导入相关状态
  const [showImportModal, setShowImportModal] = useState(false);
  const [importExam, setImportExam] = useState<Exam | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [analysisSubjectId, setAnalysisSubjectId] = useState<string>('');
  const [analysisClassId, setAnalysisClassId] = useState<string>('');

  const [filterGrade, setFilterGrade] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');

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
    queryKey: ['exams', filterGrade, filterStatus, searchKeyword],
    queryFn: async () => {
      const res = await examsApi.list({
        gradeId: filterGrade || undefined,
        status: filterStatus || undefined,
        search: searchKeyword || undefined,
      });
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

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      examsApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams'] });
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || '状态更新失败');
    },
  });

  const copyExamMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      examsApi.copy(id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams'] });
      setCopyExamConfirm(null);
      setCopyExamName('');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || '复制失败');
    },
  });

  const importExcelMutation = useMutation({
    mutationFn: ({ examId, file }: { examId: string; file: File }) => {
      const formData = new FormData();
      formData.append('file', file);
      return scoresApi.importExcel(examId, formData);
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['scores', importExam?.id] });
      queryClient.invalidateQueries({ queryKey: ['exams'] });
      alert(`导入完成：成功 ${result.data.success} 条，失败 ${result.data.failed} 条`);
      setShowImportModal(false);
      setUploadedFile(null);
      setImportPreview([]);
      setImportErrors([]);
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
      startTime: '',
      endTime: '',
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

  // 文件拖拽处理
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, []);

  const handleFileSelect = (file: File) => {
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      alert('请上传Excel文件(.xlsx或.xls)');
      return;
    }
    setUploadedFile(file);
    // 这里可以添加预览逻辑
    setImportPreview([]);
    setImportErrors([]);
  };

  const handleImport = () => {
    if (!importExam || !uploadedFile) return;
    importExcelMutation.mutate({ examId: importExam.id, file: uploadedFile });
  };

  const handleDownloadTemplate = async (exam: Exam) => {
    try {
      const response = await scoresApi.downloadTemplate(exam.id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${exam.name}_成绩导入模板.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert('下载模板失败');
    }
  };

  const handleExportScores = async () => {
    if (!selectedExam) return;
    try {
      const response = await scoresApi.exportScores(selectedExam.id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${selectedExam.name}_成绩导出.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert('导出成绩失败');
    }
  };

  const handleSubjectToggle = (subjectId: string, checked: boolean) => {
    if (checked) {
      setExamForm({
        ...examForm,
        subjects: [
          ...examForm.subjects,
          {
            subjectId,
            maxScore: 100,
            excellentLine: 90,
            passLine: 60,
            lowLine: 40,
            weight: 1,
            includeInTotal: true,
            includeInRank: true,
          },
        ],
      });
    } else {
      setExamForm({
        ...examForm,
        subjects: examForm.subjects.filter((s) => s.subjectId !== subjectId),
      });
    }
  };

  const updateSubjectConfig = (subjectId: string, field: string, value: any) => {
    setExamForm({
      ...examForm,
      subjects: examForm.subjects.map((s) =>
        s.subjectId === subjectId ? { ...s, [field]: value } : s
      ),
    });
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 按学生分组显示成绩
  const groupedScores = scores?.reduce((acc, score) => {
    const studentId = score.students.id;
    if (!acc[studentId]) {
      acc[studentId] = {
        student: score.students,
        scores: [],
      };
    }
    acc[studentId].scores.push(score);
    return acc;
  }, {} as Record<string, { student: any; scores: Score[] }>);

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
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={filterGrade}
                onChange={(e) => setFilterGrade(e.target.value)}
                className="px-3 py-2 border border-ds-border rounded-md bg-ds-surface text-ds-fg focus:outline-none focus:ring-2 focus:ring-ds-primary/50"
              >
                <option value="">全部年级</option>
                {grades?.map((grade: any) => (
                  <option key={grade.id} value={grade.id}>{grade.name}</option>
                ))}
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-ds-border rounded-md bg-ds-surface text-ds-fg focus:outline-none focus:ring-2 focus:ring-ds-primary/50"
              >
                <option value="">全部状态</option>
                {Object.entries(examStatusMap).map(([key, value]) => (
                  <option key={key} value={key}>{value.label}</option>
                ))}
              </select>
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="搜索考试名称..."
                className="px-3 py-2 border border-ds-border rounded-md bg-ds-surface text-ds-fg focus:outline-none focus:ring-2 focus:ring-ds-primary/50 w-48"
              />
            </div>
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
                  <th className="px-4 py-3 text-left text-sm font-medium text-ds-fg">考试时间</th>
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
                      <td className="px-4 py-3 text-sm text-ds-fg-muted">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(exam.startTime)}
                        </div>
                      </td>
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
                          <button
                            onClick={() => {
                              setImportExam(exam);
                              setShowImportModal(true);
                            }}
                            className="p-1.5 text-ds-fg-muted hover:text-ds-success transition-colors"
                            title="导入成绩"
                          >
                            <Upload className="w-4 h-4" />
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
                                    startTime: exam.startTime?.slice(0, 16) || '',
                                    endTime: exam.endTime?.slice(0, 16) || '',
                                    subjects: exam.exam_subjects?.map((es) => ({
                                      subjectId: es.subjectId,
                                      maxScore: es.maxScore,
                                      excellentLine: es.excellentLine || 90,
                                      passLine: es.passLine || 60,
                                      lowLine: es.lowLine || 40,
                                      weight: es.weight,
                                      includeInTotal: es.includeInTotal,
                                      includeInRank: es.includeInRank,
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
                            </>
                          )}
                          {exam.status !== 'archived' && nextStatusMap[exam.status] && (
                            <button
                              onClick={() => updateStatusMutation.mutate({ id: exam.id, status: nextStatusMap[exam.status] })}
                              className="p-1.5 text-ds-fg-muted hover:text-ds-success transition-colors"
                              title={statusActionMap[exam.status]}
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setCopyExamConfirm(exam);
                              setCopyExamName(exam.name + ' (副本)');
                            }}
                            className="p-1.5 text-ds-fg-muted hover:text-ds-primary transition-colors"
                            title="复制"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
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
                      setImportExam(selectedExam);
                      setShowImportModal(true);
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
                  <button
                    onClick={handleExportScores}
                    className="flex items-center gap-2 px-4 py-2 border border-ds-border text-ds-fg rounded-md hover:bg-ds-surface-2 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    导出成绩
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
                      {selectedExam.exam_subjects?.map((es) => (
                        <th key={es.subjectId} className="px-4 py-3 text-center text-sm font-medium text-ds-fg">
                          {es.subjects.name}
                        </th>
                      ))}
                      <th className="px-4 py-3 text-center text-sm font-medium text-ds-fg">总分</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.keys(groupedScores || {}).length === 0 ? (
                      <tr>
                        <td colSpan={4 + (selectedExam.exam_subjects?.length || 0)} className="px-4 py-8 text-center text-ds-fg-muted">
                          暂无成绩数据
                        </td>
                      </tr>
                    ) : (
                      Object.values(groupedScores || {}).map(({ student, scores: studentScores }) => {
                        const scoreMap = new Map(studentScores.map((s) => [s.exam_subjects?.subjects?.id || s.subjectId, s]));
                        let totalScore = 0;
                        let hasTotal = false;
                        return (
                          <tr key={student.id} className="border-t border-ds-border hover:bg-ds-surface-2/50 transition-colors">
                            <td className="px-4 py-3 text-sm text-ds-fg-muted">{student.studentNo}</td>
                            <td className="px-4 py-3 text-sm font-medium text-ds-fg">{student.users.name}</td>
                            <td className="px-4 py-3 text-sm text-ds-fg-muted">{student.classes?.name}</td>
                            {selectedExam.exam_subjects?.map((es) => {
                              const score = scoreMap.get(es.subjects?.id || es.subjectId);
                              if (score && !score.isAbsent && es.includeInTotal) {
                                totalScore += score.rawScore;
                                hasTotal = true;
                              }
                              return (
                                <td key={es.subjectId} className="px-4 py-3 text-sm text-center">
                                  {score ? (
                                    score.isAbsent ? (
                                      <span className="text-ds-warning">缺考</span>
                                    ) : (
                                      <span className={score.rawScore >= (es.excellentLine || 90) ? 'text-ds-success' : score.rawScore < (es.passLine || 60) ? 'text-ds-danger' : 'text-ds-fg'}>
                                        {score.rawScore}
                                      </span>
                                    )
                                  ) : (
                                    <span className="text-ds-fg-muted">-</span>
                                  )}
                                </td>
                              );
                            })}
                            <td className="px-4 py-3 text-sm font-medium text-center text-ds-fg">
                              {hasTotal ? totalScore : '-'}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* 考试创建/编辑模态框 */}
      {showExamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ds-overlay/50 backdrop-blur-sm">
          <div className="w-full max-w-3xl glass-card p-6 max-h-[90vh] overflow-y-auto">
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
                  placeholder="如：2024-2025学年第一学期期中考试"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
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
                    <option value="weekly">周测</option>
                    <option value="unit">单元测</option>
                  </select>
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-ds-fg mb-1">开始时间</label>
                  <input
                    type="datetime-local"
                    value={examForm.startTime}
                    onChange={(e) => setExamForm({ ...examForm, startTime: e.target.value })}
                    className="w-full px-3 py-2 border border-ds-border rounded-md bg-ds-surface text-ds-fg focus:outline-none focus:ring-2 focus:ring-ds-primary/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ds-fg mb-1">结束时间</label>
                  <input
                    type="datetime-local"
                    value={examForm.endTime}
                    onChange={(e) => setExamForm({ ...examForm, endTime: e.target.value })}
                    className="w-full px-3 py-2 border border-ds-border rounded-md bg-ds-surface text-ds-fg focus:outline-none focus:ring-2 focus:ring-ds-primary/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-ds-fg mb-2">考试科目配置</label>
                <div className="border border-ds-border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-ds-surface">
                      <tr>
                        <th className="px-3 py-2 text-left text-sm font-medium text-ds-fg w-24">选择</th>
                        <th className="px-3 py-2 text-left text-sm font-medium text-ds-fg">科目</th>
                        <th className="px-3 py-2 text-left text-sm font-medium text-ds-fg w-20">满分</th>
                        <th className="px-3 py-2 text-left text-sm font-medium text-ds-fg w-20">优秀线</th>
                        <th className="px-3 py-2 text-left text-sm font-medium text-ds-fg w-20">及格线</th>
                        <th className="px-3 py-2 text-left text-sm font-medium text-ds-fg w-20">低分线</th>
                        <th className="px-3 py-2 text-center text-sm font-medium text-ds-fg w-20">计入总分</th>
                        <th className="px-3 py-2 text-center text-sm font-medium text-ds-fg w-20">参与排名</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subjects?.map((subject: any) => {
                        const config = examForm.subjects.find((s) => s.subjectId === subject.id);
                        return (
                          <tr key={subject.id} className="border-t border-ds-border">
                            <td className="px-3 py-2">
                              <input
                                type="checkbox"
                                checked={!!config}
                                onChange={(e) => handleSubjectToggle(subject.id, e.target.checked)}
                                className="rounded border-ds-border"
                              />
                            </td>
                            <td className="px-3 py-2 text-sm text-ds-fg">{subject.name}</td>
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                value={config?.maxScore || 100}
                                onChange={(e) => updateSubjectConfig(subject.id, 'maxScore', Number(e.target.value))}
                                className="w-full px-2 py-1 border border-ds-border rounded text-sm"
                                disabled={!config}
                                min="1"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                value={config?.excellentLine || 90}
                                onChange={(e) => updateSubjectConfig(subject.id, 'excellentLine', Number(e.target.value))}
                                className="w-full px-2 py-1 border border-ds-border rounded text-sm"
                                disabled={!config}
                                min="0"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                value={config?.passLine || 60}
                                onChange={(e) => updateSubjectConfig(subject.id, 'passLine', Number(e.target.value))}
                                className="w-full px-2 py-1 border border-ds-border rounded text-sm"
                                disabled={!config}
                                min="0"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                value={config?.lowLine || 40}
                                onChange={(e) => updateSubjectConfig(subject.id, 'lowLine', Number(e.target.value))}
                                className="w-full px-2 py-1 border border-ds-border rounded text-sm"
                                disabled={!config}
                                min="0"
                              />
                            </td>
                            <td className="px-3 py-2 text-center">
                              <input
                                type="checkbox"
                                checked={config?.includeInTotal ?? true}
                                onChange={(e) => updateSubjectConfig(subject.id, 'includeInTotal', e.target.checked)}
                                className="rounded border-ds-border"
                                disabled={!config}
                              />
                            </td>
                            <td className="px-3 py-2 text-center">
                              <input
                                type="checkbox"
                                checked={config?.includeInRank ?? true}
                                onChange={(e) => updateSubjectConfig(subject.id, 'includeInRank', e.target.checked)}
                                className="rounded border-ds-border"
                                disabled={!config}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

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

      {/* 成绩导入模态框 */}
      {showImportModal && importExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ds-overlay/50 backdrop-blur-sm">
          <div className="w-full max-w-2xl glass-card p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-ds-fg">导入成绩 - {importExam.name}</h2>
              <button onClick={() => {
                setShowImportModal(false);
                setUploadedFile(null);
                setImportPreview([]);
                setImportErrors([]);
              }} className="text-ds-fg-muted hover:text-ds-fg transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              {/* 下载模板 */}
              <div className="flex items-center justify-between p-4 bg-ds-surface-2 rounded-lg">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="w-8 h-8 text-ds-success" />
                  <div>
                    <div className="text-sm font-medium text-ds-fg">成绩导入模板</div>
                    <div className="text-xs text-ds-fg-muted">包含学生名单和所有科目</div>
                  </div>
                </div>
                <button
                  onClick={() => handleDownloadTemplate(importExam)}
                  className="flex items-center gap-2 px-4 py-2 border border-ds-border rounded-md hover:bg-ds-surface text-ds-fg transition-colors"
                >
                  <Download className="w-4 h-4" />
                  下载模板
                </button>
              </div>

              {/* 文件上传区域 */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragging
                    ? 'border-ds-primary bg-ds-primary/10'
                    : uploadedFile
                    ? 'border-ds-success bg-ds-success/10'
                    : 'border-ds-border hover:border-ds-primary/50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                  className="hidden"
                />
                {uploadedFile ? (
                  <div className="flex flex-col items-center gap-2">
                    <FileSpreadsheet className="w-12 h-12 text-ds-success" />
                    <div className="text-sm font-medium text-ds-fg">{uploadedFile.name}</div>
                    <div className="text-xs text-ds-fg-muted">
                      大小: {(uploadedFile.size / 1024).toFixed(1)} KB
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setUploadedFile(null);
                      }}
                      className="text-xs text-ds-danger hover:underline"
                    >
                      移除文件
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="w-12 h-12 text-ds-fg-muted" />
                    <div className="text-sm font-medium text-ds-fg">点击或拖拽上传Excel文件</div>
                    <div className="text-xs text-ds-fg-muted">支持 .xlsx, .xls 格式</div>
                  </div>
                )}
              </div>

              {/* 导入说明 */}
              <div className="p-4 bg-ds-surface-2 rounded-lg text-sm">
                <div className="font-medium text-ds-fg mb-2">导入说明：</div>
                <ul className="space-y-1 text-ds-fg-muted text-xs">
                  <li>1. 请先下载模板，按模板格式填写成绩</li>
                  <li>2. 学号必须与系统中的学号一致</li>
                  <li>3. 分数请填写0到满分之间的数值</li>
                  <li>4. 缺考学生请在对应科目填写"缺考"</li>
                  <li>5. 支持一次性导入所有科目的成绩</li>
                </ul>
              </div>

              {/* 操作按钮 */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowImportModal(false);
                    setUploadedFile(null);
                    setImportPreview([]);
                    setImportErrors([]);
                  }}
                  className="flex-1 px-4 py-2 border border-ds-border rounded-md hover:bg-ds-surface-2 text-ds-fg transition-colors"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={handleImport}
                  disabled={!uploadedFile || importExcelMutation.isPending}
                  className="flex-1 px-4 py-2 bg-ds-primary text-ds-fg rounded-md hover:bg-ds-primary/90 disabled:opacity-50 transition-colors"
                >
                  {importExcelMutation.isPending ? '导入中...' : '确认导入'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 成绩分析模态框 */}
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

      <AlertDialog open={!!copyExamConfirm} onOpenChange={() => setCopyExamConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>复制考试</AlertDialogTitle>
            <AlertDialogDescription>
              <div className="mt-2">
                <label className="block text-sm font-medium text-ds-fg mb-1">新考试名称</label>
                <input
                  type="text"
                  value={copyExamName}
                  onChange={(e) => setCopyExamName(e.target.value)}
                  className="w-full px-3 py-2 border border-ds-border rounded-md bg-ds-surface text-ds-fg focus:outline-none focus:ring-2 focus:ring-ds-primary/50"
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => copyExamConfirm && copyExamMutation.mutate({ id: copyExamConfirm.id, name: copyExamName })}
              disabled={!copyExamName.trim() || copyExamMutation.isPending}
            >
              {copyExamMutation.isPending ? '复制中...' : '确认复制'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
