import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { gradesApi, classesApi, teachersApi } from '@/lib/api';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
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

interface Grade {
  id: string;
  name: string;
}

interface Teacher {
  id: string;
  teacherNo: string;
  name: string;
}

interface ClassItem {
  id: string;
  name: string;
  gradeId: string;
  grades: { id: string; name: string };
  teachers?: { id: string; name: string; teacherNo: string };
  _count?: { students: number };
}

export default function Classes() {
  const queryClient = useQueryClient();
  const [selectedGradeId, setSelectedGradeId] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassItem | null>(null);
  const [formData, setFormData] = useState({ name: '', gradeId: '', headTeacherId: '' });
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<ClassItem | null>(null);
  const [teacherSearch, setTeacherSearch] = useState('');
  const [showTeacherDropdown, setShowTeacherDropdown] = useState(false);

  const { data: grades, isLoading: gradesLoading } = useQuery({
    queryKey: ['grades'],
    queryFn: async () => {
      const res = await gradesApi.list();
      return res.data as Grade[];
    },
  });

  const { data: teachers } = useQuery({
    queryKey: ['teachers'],
    queryFn: async () => {
      const res = await teachersApi.list();
      return res.data as Teacher[];
    },
  });

  const filteredTeachers = teachers?.filter((teacher) =>
    teacher.name.toLowerCase().includes(teacherSearch.toLowerCase()) ||
    teacher.teacherNo.toLowerCase().includes(teacherSearch.toLowerCase())
  );

  const { data: classes, isLoading: classesLoading } = useQuery({
    queryKey: ['classes', selectedGradeId],
    queryFn: async () => {
      const res = await classesApi.list(selectedGradeId ? { gradeId: selectedGradeId } : undefined);
      return res.data as ClassItem[];
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: { name: string; gradeId: string }) => classesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      closeModal();
    },
    onError: (err: any) => setError(err.response?.data?.message || '创建失败'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => classesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      closeModal();
    },
    onError: (err: any) => setError(err.response?.data?.message || '更新失败'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => classesApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['classes'] }),
    onError: (err: any) => alert(err.response?.data?.message || '删除失败'),
  });

  const openCreateModal = () => {
    setEditingClass(null);
    setFormData({ name: '', gradeId: selectedGradeId || grades?.[0]?.id || '', headTeacherId: '' });
    setError('');
    setShowModal(true);
  };

  const openEditModal = (classItem: ClassItem) => {
    setEditingClass(classItem);
    setFormData({
      name: classItem.name,
      gradeId: classItem.gradeId,
      headTeacherId: classItem.teachers?.id || '',
    });
    setError('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingClass(null);
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingClass) {
      const updateData: any = { name: formData.name };
      if (formData.headTeacherId) {
        updateData.headTeacherId = formData.headTeacherId;
      }
      updateMutation.mutate({ id: editingClass.id, data: updateData });
    } else {
      createMutation.mutate({ name: formData.name, gradeId: formData.gradeId });
    }
  };

  const handleDelete = () => {
    if (deleteConfirm) {
      deleteMutation.mutate(deleteConfirm.id);
      setDeleteConfirm(null);
    }
  };

  const isLoading = gradesLoading || classesLoading;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ds-fg">班级管理</h1>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 rounded-md bg-ds-primary px-4 py-2 text-sm text-white transition-colors hover:bg-ds-primary/90 focus:outline-none focus:ring-2 focus:ring-ds-primary/20"
        >
          <Plus className="h-4 w-4" />
          新增班级
        </button>
      </div>

      <div className="flex items-center gap-4">
        <Select value={selectedGradeId || 'all'} onValueChange={(v) => setSelectedGradeId(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="全部年级" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部年级</SelectItem>
            {grades?.map((grade) => (
              <SelectItem key={grade.id} value={grade.id}>
                {grade.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="surface-card overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-ds-fg-muted">加载中...</div>
        ) : classes?.length === 0 ? (
          <div className="p-8 text-center text-ds-fg-muted">暂无班级数据</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-ds-border bg-ds-surface">
                <th className="px-4 py-3 text-left text-sm font-medium text-ds-fg-muted">班级名称</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-ds-fg-muted">所属年级</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-ds-fg-muted">班主任</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-ds-fg-muted">学生数</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-ds-fg-muted">操作</th>
              </tr>
            </thead>
            <tbody>
              {classes?.map((classItem) => (
                <tr
                  key={classItem.id}
                  className="border-b border-ds-divider transition-colors hover:bg-ds-surface"
                >
                  <td className="px-4 py-3 text-sm font-medium text-ds-fg">{classItem.name}</td>
                  <td className="px-4 py-3 text-sm text-ds-fg-muted">{classItem.grades?.name || '-'}</td>
                  <td className="px-4 py-3 text-sm text-ds-fg-muted">
                    {classItem.teachers ? `${classItem.teachers.name} (${classItem.teachers.teacherNo})` : '未分配'}
                  </td>
                  <td className="px-4 py-3 text-sm text-ds-fg-muted tabular-nums">
                    {classItem._count?.students || 0}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEditModal(classItem)}
                        className="rounded p-1.5 text-ds-fg-muted transition-colors hover:bg-ds-surface-2 hover:text-ds-fg focus:outline-none focus:ring-2 focus:ring-ds-primary/20"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(classItem)}
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
                {editingClass ? '编辑班级' : '新增班级'}
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

              {!editingClass && (
                <div>
                  <label className="mb-1.5 block text-sm text-ds-fg-muted">所属年级</label>
                  <Select value={formData.gradeId} onValueChange={(v) => setFormData({ ...formData, gradeId: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="请选择年级" />
                    </SelectTrigger>
                    <SelectContent>
                      {grades?.map((grade) => (
                        <SelectItem key={grade.id} value={grade.id}>
                          {grade.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-sm text-ds-fg-muted">班级名称</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="如：高一(1)班"
                  className="w-full rounded-md border border-ds-border bg-ds-surface px-4 py-2.5 text-ds-fg outline-none transition-colors placeholder:text-ds-fg-subtle focus:border-ds-primary focus:ring-2 focus:ring-ds-primary/20"
                  required
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm text-ds-fg-muted">班主任</label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.headTeacherId ? teachers?.find(t => t.id === formData.headTeacherId)?.name + ' (' + teachers?.find(t => t.id === formData.headTeacherId)?.teacherNo + ')' : teacherSearch}
                    onChange={(e) => {
                      setTeacherSearch(e.target.value);
                      setShowTeacherDropdown(true);
                      if (!e.target.value) {
                        setFormData({ ...formData, headTeacherId: '' });
                      }
                    }}
                    onFocus={() => setShowTeacherDropdown(true)}
                    placeholder="搜索教师姓名或工号..."
                    className="w-full rounded-md border border-ds-border bg-ds-surface px-4 py-2.5 text-ds-fg outline-none transition-colors placeholder:text-ds-fg-subtle focus:border-ds-primary focus:ring-2 focus:ring-ds-primary/20"
                  />
                  {formData.headTeacherId && (
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, headTeacherId: '' });
                        setTeacherSearch('');
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-ds-fg-muted hover:text-ds-fg"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                {showTeacherDropdown && (
                  <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-ds-border bg-ds-surface shadow-lg">
                    <div className="p-2">
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, headTeacherId: '' });
                          setTeacherSearch('');
                          setShowTeacherDropdown(false);
                        }}
                        className="w-full rounded px-3 py-2 text-left text-sm text-ds-fg-muted hover:bg-ds-surface-2"
                      >
                        不分配班主任
                      </button>
                      {filteredTeachers?.map((teacher) => (
                        <button
                          key={teacher.id}
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, headTeacherId: teacher.id });
                            setTeacherSearch('');
                            setShowTeacherDropdown(false);
                          }}
                          className="w-full rounded px-3 py-2 text-left text-sm text-ds-fg hover:bg-ds-surface-2"
                        >
                          {teacher.name} ({teacher.teacherNo})
                        </button>
                      ))}
                      {filteredTeachers?.length === 0 && teacherSearch && (
                        <div className="px-3 py-2 text-sm text-ds-fg-muted">
                          未找到匹配的教师
                        </div>
                      )}
                    </div>
                  </div>
                )}
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
              确定要删除班级「{deleteConfirm?.name}」吗？此操作不可撤销，该班级下的学生数据将被检查。
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
