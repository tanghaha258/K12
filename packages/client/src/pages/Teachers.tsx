import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teachersApi, subjectsApi, classesApi } from '@/lib/api';
import { Search, Plus, Trash2, X, BookOpen, Upload, Download, FileSpreadsheet, CheckCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

interface Teacher {
  id: string;
  teacherNo: string;
  name: string;
  userId: string;
  user: { id: string; name: string; account: string; status: string };
  teacherClasses?: { class: { id: string; name: string; grade: { id: string; name: string } }; subject: { id: string; name: string } }[];
  managedClasses?: { id: string; name: string; grade: { id: string; name: string } }[];
}

export default function Teachers() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchText, setSearchText] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Teacher | null>(null);
  const [formData, setFormData] = useState({ teacherNo: '', name: '' });
  const [assignData, setAssignData] = useState({ classId: '', subjectId: '' });
  const [error, setError] = useState('');
  const [importData, setImportData] = useState<{
    file: File | null;
    preview: any[];
    errors: { row: number; message: string }[];
  }>({ file: null, preview: [], errors: [] });

  const { data: teachers, isLoading } = useQuery({
    queryKey: ['teachers', searchText],
    queryFn: async () => {
      const res = await teachersApi.list({ search: searchText || undefined });
      return res.data as Teacher[];
    },
  });

  const { data: subjects } = useQuery({
    queryKey: ['subjects'],
    queryFn: async () => {
      const res = await subjectsApi.list();
      return res.data;
    },
  });

  const { data: classes } = useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      const res = await classesApi.list();
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: { teacherNo: string; name: string }) => teachersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      closeModal();
    },
    onError: (err: any) => setError(err.response?.data?.message || '创建失败'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => teachersApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['teachers'] }),
    onError: (err: any) => alert(err.response?.data?.message || '删除失败'),
  });

  const assignMutation = useMutation({
    mutationFn: (data: { teacherId: string; classId: string; subjectId: string }) =>
      teachersApi.assignClass(data.teacherId, { classId: data.classId, subjectId: data.subjectId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      setShowAssignModal(false);
    },
    onError: (err: any) => alert(err.response?.data?.message || '分配失败'),
  });

  const openCreateModal = () => {
    setSelectedTeacher(null);
    setFormData({ teacherNo: '', name: '' });
    setError('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const handleDelete = () => {
    if (deleteConfirm) {
      deleteMutation.mutate(deleteConfirm.id);
      setDeleteConfirm(null);
    }
  };

  const handleAssign = () => {
    if (selectedTeacher && assignData.classId && assignData.subjectId) {
      assignMutation.mutate({
        teacherId: selectedTeacher.id,
        classId: assignData.classId,
        subjectId: assignData.subjectId,
      });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportData({ file, preview: [], errors: [] });
    const mockPreview = [
      { teacherNo: 'T001', name: '张老师' },
      { teacherNo: 'T002', name: '李老师' },
    ];
    setImportData(prev => ({ ...prev, preview: mockPreview }));
  };

  const handleImport = () => {
    alert('批量导入功能将在后续实现');
    setShowImportModal(false);
  };

  const handleExport = () => {
    if (!teachers || teachers.length === 0) {
      alert('暂无教师数据可导出');
      return;
    }
    const csvContent = [
      ['工号', '姓名', '状态', '任教班级数', '班主任班级'].join(','),
      ...teachers.map(t => [
        t.teacherNo,
        t.name,
        t.user?.status === 'ACTIVE' ? '正常' : '停用',
        t.teacherClasses?.length || 0,
        t.managedClasses?.map(c => c.name).join('、') || '-'
      ].join(','))
    ].join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `教师列表_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      ACTIVE: 'bg-ds-success/20 text-ds-success',
      INACTIVE: 'bg-ds-fg-muted/20 text-ds-fg-muted',
      PENDING: 'bg-ds-warning/20 text-ds-warning',
    };
    const labels: Record<string, string> = { ACTIVE: '正常', INACTIVE: '停用', PENDING: '待激活' };
    return (
      <span className={`rounded-full px-2 py-0.5 text-xs ${styles[status] || styles.ACTIVE}`}>
        {labels[status] || status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ds-fg">教师管理</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 rounded-md bg-ds-surface-2 px-4 py-2 text-sm text-ds-fg transition-colors hover:bg-ds-surface focus:outline-none focus:ring-2 focus:ring-ds-primary/20"
          >
            <Upload className="h-4 w-4" />
            批量导入
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 rounded-md bg-ds-surface-2 px-4 py-2 text-sm text-ds-fg transition-colors hover:bg-ds-surface focus:outline-none focus:ring-2 focus:ring-ds-primary/20"
          >
            <Download className="h-4 w-4" />
            导出
          </button>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 rounded-md bg-ds-primary px-4 py-2 text-sm text-white transition-colors hover:bg-ds-primary/90 focus:outline-none focus:ring-2 focus:ring-ds-primary/20"
          >
            <Plus className="h-4 w-4" />
            新增教师
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ds-fg-muted" />
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="搜索工号或姓名..."
            className="h-9 w-full rounded-md border border-ds-border bg-ds-surface py-2 pl-10 pr-4 text-sm text-ds-fg outline-none transition-colors placeholder:text-ds-fg-subtle focus:border-ds-primary focus:ring-2 focus:ring-ds-primary/20"
          />
        </div>
      </div>

      <div className="surface-card overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-ds-fg-muted">加载中...</div>
        ) : teachers?.length === 0 ? (
          <div className="p-8 text-center text-ds-fg-muted">暂无教师数据</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-ds-border bg-ds-surface">
                <th className="px-4 py-3 text-left text-sm font-medium text-ds-fg-muted">工号</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-ds-fg-muted">姓名</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-ds-fg-muted">任教班级</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-ds-fg-muted">班主任</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-ds-fg-muted">状态</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-ds-fg-muted">操作</th>
              </tr>
            </thead>
            <tbody>
              {teachers?.map((teacher) => (
                <tr key={teacher.id} className="border-b border-ds-divider transition-colors hover:bg-ds-surface">
                  <td className="px-4 py-3 text-sm text-ds-fg tabular-nums">{teacher.teacherNo}</td>
                  <td className="px-4 py-3 text-sm font-medium text-ds-fg">{teacher.name}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {teacher.teacherClasses?.slice(0, 3).map((tc, i) => (
                        <span key={i} className="rounded bg-ds-primary/20 px-2 py-0.5 text-xs text-ds-primary">
                          {tc.class.name}·{tc.subject.name}
                        </span>
                      ))}
                      {(teacher.teacherClasses?.length || 0) > 3 && (
                        <span className="rounded bg-ds-surface-2 px-2 py-0.5 text-xs text-ds-fg-muted">
                          +{teacher.teacherClasses!.length - 3}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-ds-fg-muted">
                    {teacher.managedClasses?.map((c) => c.name).join('、') || '-'}
                  </td>
                  <td className="px-4 py-3">{getStatusBadge(teacher.user?.status || 'ACTIVE')}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => { setSelectedTeacher(teacher); setAssignData({ classId: '', subjectId: '' }); setShowAssignModal(true); }}
                        className="rounded p-1.5 text-ds-fg-muted transition-colors hover:bg-ds-primary/20 hover:text-ds-primary focus:outline-none focus:ring-2 focus:ring-ds-primary/20"
                        title="分配班级"
                      >
                        <BookOpen className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(teacher)}
                        className="rounded p-1.5 text-ds-fg-muted transition-colors hover:bg-ds-danger/20 hover:text-ds-danger focus:outline-none focus:ring-2 focus:ring-ds-danger/20"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 新增教师弹窗 */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ds-overlay/50 backdrop-blur-sm">
          <div className="w-full max-w-md glass-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-ds-fg">新增教师</h2>
              <button onClick={closeModal} className="text-ds-fg-muted transition-colors hover:text-ds-fg"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <div className="rounded-md bg-ds-danger/10 px-4 py-3 text-sm text-ds-danger">{error}</div>}
              <div>
                <label className="mb-1.5 block text-sm text-ds-fg-muted">工号 *</label>
                <input type="text" value={formData.teacherNo} onChange={(e) => setFormData({ ...formData, teacherNo: e.target.value })} className="w-full rounded-md border border-ds-border bg-ds-surface px-4 py-2.5 text-ds-fg outline-none transition-colors focus:border-ds-primary focus:ring-2 focus:ring-ds-primary/20" required />
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-ds-fg-muted">姓名 *</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full rounded-md border border-ds-border bg-ds-surface px-4 py-2.5 text-ds-fg outline-none transition-colors focus:border-ds-primary focus:ring-2 focus:ring-ds-primary/20" required />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeModal} className="flex-1 rounded-md border border-ds-border px-4 py-2.5 text-sm text-ds-fg transition-colors hover:bg-ds-surface-2 focus:outline-none focus:ring-2 focus:ring-ds-primary/20">取消</button>
                <button type="submit" disabled={createMutation.isPending} className="flex-1 rounded-md bg-ds-primary px-4 py-2.5 text-sm text-white transition-colors hover:bg-ds-primary/90 focus:outline-none focus:ring-2 focus:ring-ds-primary/20 disabled:opacity-50">{createMutation.isPending ? '保存中...' : '保存'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 分配班级弹窗 */}
      {showAssignModal && selectedTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ds-overlay/50 backdrop-blur-sm">
          <div className="w-full max-w-md glass-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-ds-fg">分配班级 - {selectedTeacher.name}</h2>
              <button onClick={() => setShowAssignModal(false)} className="text-ds-fg-muted transition-colors hover:text-ds-fg"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm text-ds-fg-muted">班级</label>
                <Select value={assignData.classId} onValueChange={(v) => setAssignData({ ...assignData, classId: v })}>
                  <SelectTrigger><SelectValue placeholder="请选择班级" /></SelectTrigger>
                  <SelectContent>
                    {classes?.map((cls: any) => (
                      <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-ds-fg-muted">科目</label>
                <Select value={assignData.subjectId} onValueChange={(v) => setAssignData({ ...assignData, subjectId: v })}>
                  <SelectTrigger><SelectValue placeholder="请选择科目" /></SelectTrigger>
                  <SelectContent>
                    {subjects?.map((sub: any) => (
                      <SelectItem key={sub.id} value={sub.id}>{sub.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowAssignModal(false)} className="flex-1 rounded-md border border-ds-border px-4 py-2.5 text-sm text-ds-fg transition-colors hover:bg-ds-surface-2 focus:outline-none focus:ring-2 focus:ring-ds-primary/20">取消</button>
                <button onClick={handleAssign} disabled={!assignData.classId || !assignData.subjectId || assignMutation.isPending} className="flex-1 rounded-md bg-ds-primary px-4 py-2.5 text-sm text-white transition-colors hover:bg-ds-primary/90 focus:outline-none focus:ring-2 focus:ring-ds-primary/20 disabled:opacity-50">{assignMutation.isPending ? '分配中...' : '确认分配'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 批量导入弹窗 */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ds-overlay/50 backdrop-blur-sm">
          <div className="w-full max-w-3xl glass-card max-h-[90vh] overflow-y-auto p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-ds-fg">批量导入教师</h2>
              <button onClick={() => setShowImportModal(false)} className="text-ds-fg-muted transition-colors hover:text-ds-fg"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-6">
              <div>
                <h3 className="mb-3 text-sm font-medium text-ds-fg">步骤1: 上传Excel文件</h3>
                <div onClick={() => fileInputRef.current?.click()} className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-ds-border bg-ds-surface p-8 transition-colors hover:border-ds-primary hover:bg-ds-surface-2">
                  <FileSpreadsheet className="mb-2 h-10 w-10 text-ds-fg-muted" />
                  <p className="text-sm text-ds-fg-muted">{importData.file ? importData.file.name : '点击上传或拖拽Excel文件到此处'}</p>
                  <p className="mt-1 text-xs text-ds-fg-subtle">支持 .xlsx, .xls 格式</p>
                </div>
                <input ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={handleFileSelect} className="hidden" />
              </div>

              {importData.preview.length > 0 && (
                <div>
                  <h3 className="mb-3 text-sm font-medium text-ds-fg">步骤2: 数据预览</h3>
                  <div className="surface-card overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-ds-border bg-ds-surface">
                          <th className="px-3 py-2 text-left text-xs font-medium text-ds-fg-muted">工号</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-ds-fg-muted">姓名</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-ds-fg-muted">状态</th>
                        </tr>
                      </thead>
                      <tbody>
                        {importData.preview.map((row, i) => (
                          <tr key={i} className="border-b border-ds-divider">
                            <td className="px-3 py-2 text-xs text-ds-fg">{row.teacherNo}</td>
                            <td className="px-3 py-2 text-xs text-ds-fg">{row.name}</td>
                            <td className="px-3 py-2"><span className="flex items-center gap-1 text-xs text-ds-success"><CheckCircle className="h-3 w-3" />校验通过</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="rounded-md bg-ds-surface-2 p-4">
                <h4 className="mb-2 text-sm font-medium text-ds-fg">导入规则说明</h4>
                <ul className="space-y-1 text-xs text-ds-fg-muted">
                  <li>• 工号必须唯一，不能与已有教师重复</li>
                  <li>• 导入后将自动创建教师账号，初始密码为工号</li>
                  <li>• 教师角色默认为任课教师</li>
                  <li>• 如需分配班级和科目，请在导入后手动分配</li>
                </ul>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setShowImportModal(false)} className="flex-1 rounded-md border border-ds-border px-4 py-2.5 text-sm text-ds-fg transition-colors hover:bg-ds-surface-2 focus:outline-none focus:ring-2 focus:ring-ds-primary/20">取消</button>
                <button onClick={handleImport} disabled={!importData.file} className="flex-1 rounded-md bg-ds-primary px-4 py-2.5 text-sm text-white transition-colors hover:bg-ds-primary/90 focus:outline-none focus:ring-2 focus:ring-ds-primary/20 disabled:opacity-50">开始导入</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 删除确认弹窗 */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除教师「{deleteConfirm?.name}」吗？此操作不可撤销，将同时删除该教师的账号信息和班级分配。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>确认删除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
