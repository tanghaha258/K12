import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { gradesApi } from '@/lib/api';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
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

interface Grade {
  id: string;
  name: string;
  entryYear: number;
  status: string;
  createdAt: string;
  _count?: {
    classes: number;
    students: number;
  };
}

const getCurrentGradeLevel = (entryYear: number): string => {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  let academicYear = currentYear;
  if (currentMonth < 9) academicYear -= 1;
  
  const yearsSinceEntry = academicYear - entryYear + 1;
  
  if (yearsSinceEntry <= 0) return '未入学';
  if (yearsSinceEntry === 1) return '高一';
  if (yearsSinceEntry === 2) return '高二';
  if (yearsSinceEntry === 3) return '高三';
  return '已毕业';
};

export default function Grades() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingGrade, setEditingGrade] = useState<Grade | null>(null);
  const [formData, setFormData] = useState({ name: '', entryYear: new Date().getFullYear() });
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<Grade | null>(null);

  const { data: grades, isLoading } = useQuery({
    queryKey: ['grades'],
    queryFn: async () => {
      const res = await gradesApi.list();
      return res.data as Grade[];
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: { name: string; entryYear: number }) => gradesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grades'] });
      closeModal();
    },
    onError: (err: any) => setError(err.response?.data?.message || '创建失败'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => gradesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grades'] });
      closeModal();
    },
    onError: (err: any) => setError(err.response?.data?.message || '更新失败'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => gradesApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['grades'] }),
    onError: (err: any) => alert(err.response?.data?.message || '删除失败'),
  });

  const openCreateModal = () => {
    setEditingGrade(null);
    setFormData({ name: '', entryYear: new Date().getFullYear() });
    setError('');
    setShowModal(true);
  };

  const openEditModal = (grade: Grade) => {
    setEditingGrade(grade);
    setFormData({ name: grade.name, entryYear: grade.entryYear });
    setError('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingGrade(null);
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingGrade) {
      updateMutation.mutate({ id: editingGrade.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = () => {
    if (deleteConfirm) {
      deleteMutation.mutate(deleteConfirm.id);
      setDeleteConfirm(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ds-fg">年级管理</h1>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 rounded-md bg-ds-primary px-4 py-2 text-sm text-white transition-colors hover:bg-ds-primary/90 focus:outline-none focus:ring-2 focus:ring-ds-primary/20"
        >
          <Plus className="h-4 w-4" />
          新增年级
        </button>
      </div>

      <div className="surface-card overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-ds-fg-muted">加载中...</div>
        ) : grades?.length === 0 ? (
          <div className="p-8 text-center text-ds-fg-muted">暂无年级数据</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-ds-border bg-ds-surface">
                <th className="px-4 py-3 text-left text-sm font-medium text-ds-fg-muted">年级名称</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-ds-fg-muted">入学年份</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-ds-fg-muted">当前年级</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-ds-fg-muted">班级数</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-ds-fg-muted">学生数</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-ds-fg-muted">操作</th>
              </tr>
            </thead>
            <tbody>
              {grades?.map((grade) => (
                <tr
                  key={grade.id}
                  className="border-b border-ds-divider transition-colors hover:bg-ds-surface"
                >
                  <td className="px-4 py-3 text-sm font-medium text-ds-fg">{grade.name}</td>
                  <td className="px-4 py-3 text-sm text-ds-fg-muted tabular-nums">{grade.entryYear}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-ds-primary/20 px-2 py-0.5 text-xs text-ds-primary">
                      {getCurrentGradeLevel(grade.entryYear)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-ds-fg-muted tabular-nums">{grade._count?.classes || 0}</td>
                  <td className="px-4 py-3 text-sm text-ds-fg-muted tabular-nums">{grade._count?.students || 0}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEditModal(grade)}
                        className="rounded p-1.5 text-ds-fg-muted transition-colors hover:bg-ds-surface-2 hover:text-ds-fg focus:outline-none focus:ring-2 focus:ring-ds-primary/20"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(grade)}
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

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ds-overlay/50 backdrop-blur-sm">
          <div className="w-full max-w-md glass-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-ds-fg">
                {editingGrade ? '编辑年级' : '新增年级'}
              </h2>
              <button onClick={closeModal} className="text-ds-fg-muted transition-colors hover:text-ds-fg">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-md bg-ds-danger/10 px-4 py-3 text-sm text-ds-danger">
                  {error}
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-sm text-ds-fg-muted">年级名称</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="如：2024级"
                  className="w-full rounded-md border border-ds-border bg-ds-surface px-4 py-2.5 text-ds-fg outline-none transition-colors placeholder:text-ds-fg-subtle focus:border-ds-primary focus:ring-2 focus:ring-ds-primary/20"
                  required
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm text-ds-fg-muted">入学年份</label>
                <input
                  type="number"
                  value={formData.entryYear}
                  onChange={(e) => setFormData({ ...formData, entryYear: parseInt(e.target.value) })}
                  className="w-full rounded-md border border-ds-border bg-ds-surface px-4 py-2.5 text-ds-fg outline-none transition-colors focus:border-ds-primary focus:ring-2 focus:ring-ds-primary/20"
                  required
                />
                <p className="mt-1 text-xs text-ds-fg-subtle">
                  将自动计算为：{getCurrentGradeLevel(formData.entryYear)}
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 rounded-md border border-ds-border px-4 py-2.5 text-sm text-ds-fg transition-colors hover:bg-ds-surface-2 focus:outline-none focus:ring-2 focus:ring-ds-primary/20"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-1 rounded-md bg-ds-primary px-4 py-2.5 text-sm text-white transition-colors hover:bg-ds-primary/90 focus:outline-none focus:ring-2 focus:ring-ds-primary/20 disabled:opacity-50"
                >
                  {createMutation.isPending || updateMutation.isPending ? '保存中...' : '保存'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除年级「{deleteConfirm?.name}」吗？此操作不可撤销，且该年级下的班级和学生数据将被检查。
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
