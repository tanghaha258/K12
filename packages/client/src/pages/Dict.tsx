import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { subjectsApi, scoreSegmentsApi, scoreLinesApi } from '@/lib/api';
import { gradesApi } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import {
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  X,
  Tag,
  BarChart3,
  Target,
  Check,
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

interface Subject {
  id: string;
  code: string;
  name: string;
  createdAt: string;
  subject_grades?: {
    grades: {
      id: string;
      name: string;
    };
  }[];
}

interface ScoreSegment {
  id: string;
  name: string;
  gradeId: string;
  subjectId: string | null;
  excellentMin: number;
  goodMin: number;
  passMin: number;
  failMax: number;
  isDefault: boolean;
  isActive: boolean;
  grades?: { id: string; name: string };
  subjects?: { id: string; name: string };
}

interface ScoreLine {
  id: string;
  name: string;
  type: 'ONE_BOOK' | 'REGULAR' | 'CUSTOM';
  gradeId: string;
  scoreValue: number;
  description: string | null;
  isActive: boolean;
  grades?: { id: string; name: string };
}

const scoreLineTypeMap = {
  ONE_BOOK: '一本线',
  REGULAR: '普高线',
  CUSTOM: '自定义',
};

export default function Dict() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SCHOOL_ADMIN';

  const [activeTab, setActiveTab] = useState('subjects');

  // 科目相关状态
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [deleteSubjectConfirm, setDeleteSubjectConfirm] = useState<Subject | null>(null);
  const [subjectForm, setSubjectForm] = useState({ code: '', name: '', gradeIds: [] as string[] });

  // 分段规则相关状态
  const [showSegmentModal, setShowSegmentModal] = useState(false);
  const [editingSegment, setEditingSegment] = useState<ScoreSegment | null>(null);
  const [deleteSegmentConfirm, setDeleteSegmentConfirm] = useState<ScoreSegment | null>(null);
  const [segmentForm, setSegmentForm] = useState({
    name: '',
    gradeId: '',
    subjectId: '',
    excellentMin: 90,
    goodMin: 80,
    passMin: 60,
    failMax: 59,
    isDefault: false,
  });

  // 线位配置相关状态
  const [showLineModal, setShowLineModal] = useState(false);
  const [editingLine, setEditingLine] = useState<ScoreLine | null>(null);
  const [deleteLineConfirm, setDeleteLineConfirm] = useState<ScoreLine | null>(null);
  const [lineForm, setLineForm] = useState({
    name: '',
    type: 'CUSTOM' as 'ONE_BOOK' | 'REGULAR' | 'CUSTOM',
    gradeId: '',
    scoreValue: 0,
    description: '',
  });

  // 获取年级列表
  const { data: grades } = useQuery({
    queryKey: ['grades'],
    queryFn: async () => {
      const res = await gradesApi.list();
      return res.data;
    },
  });

  // 获取科目列表
  const { data: subjects } = useQuery<Subject[]>({
    queryKey: ['subjects'],
    queryFn: async () => {
      const res = await subjectsApi.list();
      return res.data;
    },
    enabled: isAdmin,
  });

  // 获取分段规则列表
  const { data: scoreSegments } = useQuery<ScoreSegment[]>({
    queryKey: ['scoreSegments'],
    queryFn: async () => {
      const res = await scoreSegmentsApi.list();
      return res.data;
    },
    enabled: isAdmin,
  });

  // 获取线位配置列表
  const { data: scoreLines } = useQuery<ScoreLine[]>({
    queryKey: ['scoreLines'],
    queryFn: async () => {
      const res = await scoreLinesApi.list();
      return res.data;
    },
    enabled: isAdmin,
  });

  // 科目 Mutations
  const createSubjectMutation = useMutation({
    mutationFn: (data: typeof subjectForm) => subjectsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      setShowSubjectModal(false);
      setSubjectForm({ code: '', name: '', gradeIds: [] });
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || '创建失败');
    },
  });

  const updateSubjectMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: typeof subjectForm }) =>
      subjectsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      setShowSubjectModal(false);
      setEditingSubject(null);
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || '更新失败');
    },
  });

  const deleteSubjectMutation = useMutation({
    mutationFn: (id: string) => subjectsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      setDeleteSubjectConfirm(null);
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || '删除失败');
    },
  });

  // 分段规则 Mutations
  const createSegmentMutation = useMutation({
    mutationFn: (data: typeof segmentForm) => scoreSegmentsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scoreSegments'] });
      setShowSegmentModal(false);
      setSegmentForm({
        name: '',
        gradeId: '',
        subjectId: '',
        excellentMin: 90,
        goodMin: 80,
        passMin: 60,
        failMax: 59,
        isDefault: false,
      });
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || '创建失败');
    },
  });

  const updateSegmentMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<typeof segmentForm> }) =>
      scoreSegmentsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scoreSegments'] });
      setShowSegmentModal(false);
      setEditingSegment(null);
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || '更新失败');
    },
  });

  const deleteSegmentMutation = useMutation({
    mutationFn: (id: string) => scoreSegmentsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scoreSegments'] });
      setDeleteSegmentConfirm(null);
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || '删除失败');
    },
  });

  // 线位配置 Mutations
  const createLineMutation = useMutation({
    mutationFn: (data: typeof lineForm) => scoreLinesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scoreLines'] });
      setShowLineModal(false);
      setLineForm({ name: '', type: 'CUSTOM', gradeId: '', scoreValue: 0, description: '' });
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || '创建失败');
    },
  });

  const updateLineMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<typeof lineForm> }) =>
      scoreLinesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scoreLines'] });
      setShowLineModal(false);
      setEditingLine(null);
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || '更新失败');
    },
  });

  const deleteLineMutation = useMutation({
    mutationFn: (id: string) => scoreLinesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scoreLines'] });
      setDeleteLineConfirm(null);
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || '删除失败');
    },
  });

  const handleSubjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSubject) {
      updateSubjectMutation.mutate({ id: editingSubject.id, data: subjectForm });
    } else {
      createSubjectMutation.mutate(subjectForm);
    }
  };

  const handleSegmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...segmentForm,
      subjectId: segmentForm.subjectId || undefined,
    };
    if (editingSegment) {
      updateSegmentMutation.mutate({ id: editingSegment.id, data });
    } else {
      createSegmentMutation.mutate(data);
    }
  };

  const handleLineSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingLine) {
      updateLineMutation.mutate({ id: editingLine.id, data: lineForm });
    } else {
      createLineMutation.mutate(lineForm);
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 text-ds-fg-muted mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-ds-fg mb-2">权限不足</h2>
          <p className="text-ds-fg-muted">只有管理员可以管理字典与规则</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ds-fg">字典与规则</h1>
          <p className="text-sm text-ds-fg-muted mt-1">管理科目库、分段规则和线位配置</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="subjects" className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            科目库
          </TabsTrigger>
          <TabsTrigger value="segments" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            分段规则
          </TabsTrigger>
          <TabsTrigger value="lines" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            线位配置
          </TabsTrigger>
        </TabsList>

        {/* 科目库 */}
        <TabsContent value="subjects" className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => {
                setEditingSubject(null);
                setSubjectForm({ code: '', name: '', gradeIds: [] });
                setShowSubjectModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-ds-primary text-ds-fg rounded-md hover:bg-ds-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              添加科目
            </button>
          </div>

          <div className="surface-card border border-ds-border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-ds-surface">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-ds-fg">科目编码</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-ds-fg">科目名称</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-ds-fg">适用年级</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-ds-fg">操作</th>
                </tr>
              </thead>
              <tbody>
                {subjects?.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-ds-fg-muted">
                      暂无科目数据
                    </td>
                  </tr>
                ) : (
                  subjects?.map((subject) => (
                    <tr key={subject.id} className="border-t border-ds-border hover:bg-ds-surface-2/50 transition-colors">
                      <td className="px-4 py-3 text-sm text-ds-fg-muted">{subject.code}</td>
                      <td className="px-4 py-3 text-sm font-medium text-ds-fg">{subject.name}</td>
                      <td className="px-4 py-3 text-sm text-ds-fg-muted">
                        {subject.subject_grades?.map(sg => sg.grades.name).join(', ') || '所有年级'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setEditingSubject(subject);
                              setSubjectForm({
                                code: subject.code,
                                name: subject.name,
                                gradeIds: subject.subject_grades?.map(sg => sg.grades.id) || [],
                              });
                              setShowSubjectModal(true);
                            }}
                            className="p-1.5 text-ds-fg-muted hover:text-ds-primary transition-colors"
                            title="编辑"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteSubjectConfirm(subject)}
                            className="p-1.5 text-ds-fg-muted hover:text-ds-danger transition-colors"
                            title="删除"
                          >
                            <Trash2 className="w-4 h-4" />
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

        {/* 分段规则 */}
        <TabsContent value="segments" className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => {
                setEditingSegment(null);
                setSegmentForm({
                  name: '',
                  gradeId: '',
                  subjectId: '',
                  excellentMin: 90,
                  goodMin: 80,
                  passMin: 60,
                  failMax: 59,
                  isDefault: false,
                });
                setShowSegmentModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-ds-primary text-ds-fg rounded-md hover:bg-ds-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              添加分段规则
            </button>
          </div>

          <div className="surface-card border border-ds-border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-ds-surface">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-ds-fg">规则名称</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-ds-fg">适用年级</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-ds-fg">适用科目</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-ds-fg">优秀/良好/及格/低分</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-ds-fg">默认</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-ds-fg">操作</th>
                </tr>
              </thead>
              <tbody>
                {scoreSegments?.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-ds-fg-muted">
                      暂无分段规则
                    </td>
                  </tr>
                ) : (
                  scoreSegments?.map((segment) => (
                    <tr key={segment.id} className="border-t border-ds-border hover:bg-ds-surface-2/50 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-ds-fg">{segment.name}</td>
                      <td className="px-4 py-3 text-sm text-ds-fg-muted">{segment.grades?.name}</td>
                      <td className="px-4 py-3 text-sm text-ds-fg-muted">{segment.subjects?.name || '所有科目'}</td>
                      <td className="px-4 py-3 text-sm text-ds-fg-muted">
                        {segment.excellentMin}/{segment.goodMin}/{segment.passMin}/{segment.failMax}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {segment.isDefault ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-ds-primary/20 text-ds-primary">
                            <Check className="w-3 h-3 mr-1" />
                            默认
                          </span>
                        ) : (
                          <span className="text-ds-fg-muted">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setEditingSegment(segment);
                              setSegmentForm({
                                name: segment.name,
                                gradeId: segment.gradeId,
                                subjectId: segment.subjectId || '',
                                excellentMin: segment.excellentMin,
                                goodMin: segment.goodMin,
                                passMin: segment.passMin,
                                failMax: segment.failMax,
                                isDefault: segment.isDefault,
                              });
                              setShowSegmentModal(true);
                            }}
                            className="p-1.5 text-ds-fg-muted hover:text-ds-primary transition-colors"
                            title="编辑"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteSegmentConfirm(segment)}
                            className="p-1.5 text-ds-fg-muted hover:text-ds-danger transition-colors"
                            title="删除"
                          >
                            <Trash2 className="w-4 h-4" />
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

        {/* 线位配置 */}
        <TabsContent value="lines" className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => {
                setEditingLine(null);
                setLineForm({ name: '', type: 'CUSTOM', gradeId: '', scoreValue: 0, description: '' });
                setShowLineModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-ds-primary text-ds-fg rounded-md hover:bg-ds-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              添加线位配置
            </button>
          </div>

          <div className="surface-card border border-ds-border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-ds-surface">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-ds-fg">线位名称</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-ds-fg">类型</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-ds-fg">适用年级</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-ds-fg">分数线</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-ds-fg">描述</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-ds-fg">操作</th>
                </tr>
              </thead>
              <tbody>
                {scoreLines?.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-ds-fg-muted">
                      暂无线位配置
                    </td>
                  </tr>
                ) : (
                  scoreLines?.map((line) => (
                    <tr key={line.id} className="border-t border-ds-border hover:bg-ds-surface-2/50 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-ds-fg">{line.name}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${
                          line.type === 'ONE_BOOK' ? 'bg-ds-primary/20 text-ds-primary' :
                          line.type === 'REGULAR' ? 'bg-ds-success/20 text-ds-success' :
                          'bg-ds-warning/20 text-ds-warning'
                        }`}>
                          {scoreLineTypeMap[line.type]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-ds-fg-muted">{line.grades?.name}</td>
                      <td className="px-4 py-3 text-sm font-medium text-ds-fg">{line.scoreValue}分</td>
                      <td className="px-4 py-3 text-sm text-ds-fg-muted">{line.description || '-'}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setEditingLine(line);
                              setLineForm({
                                name: line.name,
                                type: line.type,
                                gradeId: line.gradeId,
                                scoreValue: line.scoreValue,
                                description: line.description || '',
                              });
                              setShowLineModal(true);
                            }}
                            className="p-1.5 text-ds-fg-muted hover:text-ds-primary transition-colors"
                            title="编辑"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteLineConfirm(line)}
                            className="p-1.5 text-ds-fg-muted hover:text-ds-danger transition-colors"
                            title="删除"
                          >
                            <Trash2 className="w-4 h-4" />
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
      </Tabs>

      {/* 科目添加/编辑弹窗 */}
      {showSubjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ds-overlay/50 backdrop-blur-sm">
          <div className="w-full max-w-md glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-ds-fg">{editingSubject ? '编辑科目' : '添加科目'}</h2>
              <button onClick={() => setShowSubjectModal(false)} className="text-ds-fg-muted hover:text-ds-fg transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubjectSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ds-fg mb-1">科目编码</label>
                <input
                  type="text"
                  value={subjectForm.code}
                  onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })}
                  className="w-full px-3 py-2 border border-ds-border rounded-md bg-ds-surface text-ds-fg focus:outline-none focus:ring-2 focus:ring-ds-primary/50"
                  required
                  disabled={!!editingSubject}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ds-fg mb-1">科目名称</label>
                <input
                  type="text"
                  value={subjectForm.name}
                  onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-ds-border rounded-md bg-ds-surface text-ds-fg focus:outline-none focus:ring-2 focus:ring-ds-primary/50"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ds-fg mb-1">适用年级（可多选）</label>
                <div className="flex flex-wrap gap-2">
                  {grades?.map((grade: any) => (
                    <label key={grade.id} className="flex items-center gap-1 px-3 py-1.5 border border-ds-border rounded-md cursor-pointer hover:bg-ds-surface-2">
                      <input
                        type="checkbox"
                        checked={subjectForm.gradeIds.includes(grade.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSubjectForm({ ...subjectForm, gradeIds: [...subjectForm.gradeIds, grade.id] });
                          } else {
                            setSubjectForm({ ...subjectForm, gradeIds: subjectForm.gradeIds.filter(id => id !== grade.id) });
                          }
                        }}
                        className="rounded border-ds-border"
                      />
                      <span className="text-sm text-ds-fg">{grade.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSubjectModal(false)}
                  className="flex-1 px-4 py-2 border border-ds-border rounded-md hover:bg-ds-surface-2 text-ds-fg transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={createSubjectMutation.isPending || updateSubjectMutation.isPending}
                  className="flex-1 px-4 py-2 bg-ds-primary text-ds-fg rounded-md hover:bg-ds-primary/90 disabled:opacity-50 transition-colors"
                >
                  {createSubjectMutation.isPending || updateSubjectMutation.isPending ? '保存中...' : '保存'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 分段规则添加/编辑弹窗 */}
      {showSegmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ds-overlay/50 backdrop-blur-sm">
          <div className="w-full max-w-md glass-card p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-ds-fg">{editingSegment ? '编辑分段规则' : '添加分段规则'}</h2>
              <button onClick={() => setShowSegmentModal(false)} className="text-ds-fg-muted hover:text-ds-fg transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSegmentSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ds-fg mb-1">规则名称</label>
                <input
                  type="text"
                  value={segmentForm.name}
                  onChange={(e) => setSegmentForm({ ...segmentForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-ds-border rounded-md bg-ds-surface text-ds-fg focus:outline-none focus:ring-2 focus:ring-ds-primary/50"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ds-fg mb-1">适用年级</label>
                <select
                  value={segmentForm.gradeId}
                  onChange={(e) => setSegmentForm({ ...segmentForm, gradeId: e.target.value })}
                  className="w-full px-3 py-2 border border-ds-border rounded-md bg-ds-surface text-ds-fg focus:outline-none focus:ring-2 focus:ring-ds-primary/50"
                  required
                >
                  <option value="">请选择年级</option>
                  {grades?.map((grade: any) => (
                    <option key={grade.id} value={grade.id}>{grade.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-ds-fg mb-1">适用科目（可选）</label>
                <select
                  value={segmentForm.subjectId}
                  onChange={(e) => setSegmentForm({ ...segmentForm, subjectId: e.target.value })}
                  className="w-full px-3 py-2 border border-ds-border rounded-md bg-ds-surface text-ds-fg focus:outline-none focus:ring-2 focus:ring-ds-primary/50"
                >
                  <option value="">所有科目</option>
                  {subjects?.map((subject) => (
                    <option key={subject.id} value={subject.id}>{subject.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-ds-fg mb-1">优秀分数线</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={segmentForm.excellentMin}
                    onChange={(e) => setSegmentForm({ ...segmentForm, excellentMin: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-ds-border rounded-md bg-ds-surface text-ds-fg focus:outline-none focus:ring-2 focus:ring-ds-primary/50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ds-fg mb-1">良好分数线</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={segmentForm.goodMin}
                    onChange={(e) => setSegmentForm({ ...segmentForm, goodMin: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-ds-border rounded-md bg-ds-surface text-ds-fg focus:outline-none focus:ring-2 focus:ring-ds-primary/50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ds-fg mb-1">及格分数线</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={segmentForm.passMin}
                    onChange={(e) => setSegmentForm({ ...segmentForm, passMin: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-ds-border rounded-md bg-ds-surface text-ds-fg focus:outline-none focus:ring-2 focus:ring-ds-primary/50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ds-fg mb-1">低分分数线</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={segmentForm.failMax}
                    onChange={(e) => setSegmentForm({ ...segmentForm, failMax: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-ds-border rounded-md bg-ds-surface text-ds-fg focus:outline-none focus:ring-2 focus:ring-ds-primary/50"
                    required
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={segmentForm.isDefault}
                  onChange={(e) => setSegmentForm({ ...segmentForm, isDefault: e.target.checked })}
                  className="rounded border-ds-border"
                />
                <label htmlFor="isDefault" className="text-sm text-ds-fg">设为默认规则</label>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSegmentModal(false)}
                  className="flex-1 px-4 py-2 border border-ds-border rounded-md hover:bg-ds-surface-2 text-ds-fg transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={createSegmentMutation.isPending || updateSegmentMutation.isPending}
                  className="flex-1 px-4 py-2 bg-ds-primary text-ds-fg rounded-md hover:bg-ds-primary/90 disabled:opacity-50 transition-colors"
                >
                  {createSegmentMutation.isPending || updateSegmentMutation.isPending ? '保存中...' : '保存'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 线位配置添加/编辑弹窗 */}
      {showLineModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ds-overlay/50 backdrop-blur-sm">
          <div className="w-full max-w-md glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-ds-fg">{editingLine ? '编辑线位配置' : '添加线位配置'}</h2>
              <button onClick={() => setShowLineModal(false)} className="text-ds-fg-muted hover:text-ds-fg transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleLineSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ds-fg mb-1">线位名称</label>
                <input
                  type="text"
                  value={lineForm.name}
                  onChange={(e) => setLineForm({ ...lineForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-ds-border rounded-md bg-ds-surface text-ds-fg focus:outline-none focus:ring-2 focus:ring-ds-primary/50"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ds-fg mb-1">线位类型</label>
                <select
                  value={lineForm.type}
                  onChange={(e) => setLineForm({ ...lineForm, type: e.target.value as any })}
                  className="w-full px-3 py-2 border border-ds-border rounded-md bg-ds-surface text-ds-fg focus:outline-none focus:ring-2 focus:ring-ds-primary/50"
                  required
                >
                  <option value="ONE_BOOK">一本线</option>
                  <option value="REGULAR">普高线</option>
                  <option value="CUSTOM">自定义</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-ds-fg mb-1">适用年级</label>
                <select
                  value={lineForm.gradeId}
                  onChange={(e) => setLineForm({ ...lineForm, gradeId: e.target.value })}
                  className="w-full px-3 py-2 border border-ds-border rounded-md bg-ds-surface text-ds-fg focus:outline-none focus:ring-2 focus:ring-ds-primary/50"
                  required
                >
                  <option value="">请选择年级</option>
                  {grades?.map((grade: any) => (
                    <option key={grade.id} value={grade.id}>{grade.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-ds-fg mb-1">分数线值</label>
                <input
                  type="number"
                  min="0"
                  max="750"
                  value={lineForm.scoreValue}
                  onChange={(e) => setLineForm({ ...lineForm, scoreValue: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-ds-border rounded-md bg-ds-surface text-ds-fg focus:outline-none focus:ring-2 focus:ring-ds-primary/50"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ds-fg mb-1">描述（可选）</label>
                <textarea
                  value={lineForm.description}
                  onChange={(e) => setLineForm({ ...lineForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-ds-border rounded-md bg-ds-surface text-ds-fg focus:outline-none focus:ring-2 focus:ring-ds-primary/50"
                  rows={3}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLineModal(false)}
                  className="flex-1 px-4 py-2 border border-ds-border rounded-md hover:bg-ds-surface-2 text-ds-fg transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={createLineMutation.isPending || updateLineMutation.isPending}
                  className="flex-1 px-4 py-2 bg-ds-primary text-ds-fg rounded-md hover:bg-ds-primary/90 disabled:opacity-50 transition-colors"
                >
                  {createLineMutation.isPending || updateLineMutation.isPending ? '保存中...' : '保存'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 删除确认弹窗 */}
      <AlertDialog open={!!deleteSubjectConfirm} onOpenChange={() => setDeleteSubjectConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除科目「{deleteSubjectConfirm?.name}」吗？此操作不可撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteSubjectConfirm && deleteSubjectMutation.mutate(deleteSubjectConfirm.id)}>
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteSegmentConfirm} onOpenChange={() => setDeleteSegmentConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除分段规则「{deleteSegmentConfirm?.name}」吗？此操作不可撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteSegmentConfirm && deleteSegmentMutation.mutate(deleteSegmentConfirm.id)}>
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteLineConfirm} onOpenChange={() => setDeleteLineConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
          <AlertDialogDescription>
              确定要删除线位配置「{deleteLineConfirm?.name}」吗？此操作不可撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteLineConfirm && deleteLineMutation.mutate(deleteLineConfirm.id)}>
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
