import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import {
  Users,
  Search,
  Upload,
  Download,
  Key,
  Power,
  PowerOff,
  X,
  FileSpreadsheet,
  Filter,
  Shield,
  ChevronLeft,
  ChevronRight,
  Eye,
  School,
  BookOpen,
  UserCircle,
  GraduationCap,
  ChevronDown,
  ChevronUp,
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

interface User {
  id: string;
  account: string;
  name: string;
  role: string;
  roleName?: string;
  roleCode?: string;
  status: string;
  createdAt: string;
  student?: {
    studentNo: string;
    grade?: { id: string; name: string };
    class?: { id: string; name: string };
  };
  teacher?: {
    teacherNo: string;
    teacherClasses?: {
      class: { id: string; name: string; grade?: { id: string; name: string } };
      subject?: { id: string; name: string };
    }[];
  };
  dataScopes?: {
    id: string;
    scopeType: string;
    scopeId: string;
    grade?: { id: string; name: string };
    class?: { id: string; name: string; grade?: { id: string; name: string } };
    subject?: { id: string; name: string };
  }[];
}

interface Role {
  id: string;
  name: string;
  code: string;
  description?: string;
}

const statusMap: Record<string, { label: string; color: string }> = {
  ACTIVE: { label: '启用', color: 'text-green-500' },
  INACTIVE: { label: '停用', color: 'text-red-500' },
  PENDING: { label: '待激活', color: 'text-yellow-500' },
};

export default function UserManagement() {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuthStore();
  const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'SCHOOL_ADMIN';
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [filters, setFilters] = useState({
    role: '',
    status: '',
    search: '',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    total: 0,
  });
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [showImportModal, setShowImportModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [detailUser, setDetailUser] = useState<User | null>(null);
  const [importType, setImportType] = useState<'STUDENT' | 'TEACHER'>('STUDENT');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['basic', 'scopes']));
  const [importData, setImportData] = useState<{
    file: File | null;
    preview: any[];
  }>({ file: null, preview: [] });
  const [resetConfirm, setResetConfirm] = useState(false);

  // 获取用户列表
  const { data: usersData, isLoading } = useQuery<{ users: User[]; total: number }>({
    queryKey: ['users', filters, pagination.page, pagination.pageSize],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.role) params.append('role', filters.role);
      if (filters.status) params.append('status', filters.status);
      if (filters.search) params.append('search', filters.search);
      params.append('page', pagination.page.toString());
      params.append('pageSize', pagination.pageSize.toString());
      const res = await api.get(`/users?${params.toString()}`);
      return res.data;
    },
    enabled: isAdmin,
  });

  const users = usersData?.users || [];
  const totalUsers = usersData?.total || 0;
  const totalPages = Math.ceil(totalUsers / pagination.pageSize);

  // 获取角色列表
  const { data: roles } = useQuery<Role[]>({
    queryKey: ['roles'],
    queryFn: async () => {
      const res = await api.get('/roles');
      return res.data;
    },
    enabled: isAdmin,
  });

  // 批量重置密码
  const resetPasswordMutation = useMutation({
    mutationFn: (userIds: string[]) =>
      api.post('/users/batch/password-reset', { userIds }),
    onSuccess: (res: any) => {
      alert(`密码重置成功！共 ${res.data.count} 个账号，默认密码：${res.data.defaultPassword}`);
      setSelectedUsers(new Set());
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || '重置失败');
    },
  });

  // 更新状态
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/users/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'], exact: false });
    },
  });

  // 分配角色
  const assignRoleMutation = useMutation({
    mutationFn: ({ id, roleId }: { id: string; roleId: string }) =>
      api.patch(`/users/${id}/role`, { roleId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['roles'], exact: false });
      setShowRoleModal(false);
      setSelectedUser(null);
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || '分配角色失败');
    },
  });

  // 获取用户详情
  const { data: userDetail, isLoading: detailLoading } = useQuery<User>({
    queryKey: ['userDetail', detailUser?.id],
    queryFn: async () => {
      const res = await api.get(`/users/${detailUser?.id}`);
      return res.data;
    },
    enabled: !!detailUser?.id && showDetailModal,
  });

  // 批量导入
  const importMutation = useMutation({
    mutationFn: ({ type, users }: { type: 'STUDENT' | 'TEACHER'; users: any[] }) =>
      api.post('/users/import', { type, users }),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['users'], exact: false });
      setShowImportModal(false);
      setImportData({ file: null, preview: [] });
      if (res.data.failed > 0) {
        alert(`导入完成：成功 ${res.data.success} 条，失败 ${res.data.failed} 条\n${res.data.errors.map((e: any) => `第${e.row}行: ${e.message}`).join('\n')}`);
      } else {
        alert(`导入成功：共 ${res.data.success} 条数据，默认密码：123456`);
      }
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || '导入失败');
    },
  });

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedUsers(new Set(users.map((u) => u.id)));
    } else {
      setSelectedUsers(new Set());
    }
  };

  const handleResetPassword = () => {
    resetPasswordMutation.mutate(Array.from(selectedUsers));
    setResetConfirm(false);
  };

  const handleSelectUser = (id: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedUsers(newSelected);
  };

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const openDetailModal = (user: User) => {
    setDetailUser(user);
    setShowDetailModal(true);
    setExpandedSections(new Set(['basic', 'scopes']));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const data = event.target?.result;
      if (data) {
        try {
          const lines = (data as string).split('\n').filter((line) => line.trim());
          const headers = lines[0].split(',').map((h) => h.trim());

          const preview: any[] = [];
          for (let i = 1; i < lines.length && i <= 5; i++) {
            const values = lines[i].split(',').map((v) => v.trim());
            const row: any = {};
            headers.forEach((h, idx) => {
              row[h] = values[idx] || '';
            });
            preview.push(row);
          }

          setImportData({ file, preview });
        } catch (err) {
          alert('文件解析失败，请检查CSV格式');
        }
      }
    };
    reader.readAsText(file);
  };

  const handleImport = () => {
    if (!importData.file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const data = event.target?.result;
      if (data) {
        const lines = (data as string).split('\n').filter((line) => line.trim());
        const headers = lines[0].split(',').map((h) => h.trim());

        const users: any[] = [];
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map((v) => v.trim());
          const row: any = {};
          headers.forEach((h, idx) => {
            row[h] = values[idx] || '';
          });

          if (importType === 'STUDENT' && row['学号']) {
            users.push({
              studentNo: row['学号'],
              name: row['姓名'],
              gender: row['性别'] === '女' ? 'female' : 'male',
              entryYear: parseInt(row['入学年份']) || new Date().getFullYear(),
              gradeId: row['年级ID'],
              classId: row['班级ID'],
            });
          } else if (importType === 'TEACHER' && row['工号']) {
            users.push({
              teacherNo: row['工号'],
              name: row['姓名'],
              role: row['角色'] || 'SUBJECT_TEACHER',
            });
          }
        }

        importMutation.mutate({ type: importType, users });
      }
    };
    reader.readAsText(importData.file);
  };

  const downloadTemplate = (type: 'STUDENT' | 'TEACHER') => {
    let csvContent = '';
    if (type === 'STUDENT') {
      csvContent = '学号,姓名,性别,入学年份,年级ID,班级ID\n2024001,张三,男,2024,grade_id,class_id\n2024002,李四,女,2024,grade_id,class_id';
    } else {
      csvContent = '工号,姓名,角色\nT001,王老师,SUBJECT_TEACHER\nT002,李老师,CLASS_TEACHER';
    }
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${type === 'STUDENT' ? '学生' : '教师'}导入模板.csv`;
    link.click();
  };

  if (!isAdmin) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">权限不足</h2>
          <p className="text-muted-foreground">只有管理员可以管理用户</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ds-fg">用户管理</h1>
        <button
          onClick={() => setShowImportModal(true)}
          className="flex items-center gap-2 rounded-md bg-ds-primary px-4 py-2 text-sm text-white transition-colors hover:bg-ds-primary/90"
        >
          <Upload className="h-4 w-4" />
          批量导入
        </button>
      </div>

      {/* 筛选栏 */}
      <div className="flex flex-wrap gap-4 surface-card rounded-lg p-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-ds-fg-muted" />
          <select
            value={filters.role}
            onChange={(e) => setFilters({ ...filters, role: e.target.value })}
            className="rounded-md border border-ds-border bg-ds-surface px-3 py-1.5 text-sm text-ds-fg"
          >
            <option value="">全部角色</option>
            <option value="ADMIN">超级管理员</option>
            <option value="SCHOOL_ADMIN">学校管理员</option>
            <option value="GRADE_ADMIN">年级主任</option>
            <option value="CLASS_TEACHER">班主任</option>
            <option value="SUBJECT_TEACHER">科任老师</option>
            <option value="STUDENT">学生</option>
          </select>
        </div>
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          className="rounded-md border border-ds-border bg-ds-surface px-3 py-1.5 text-sm text-ds-fg"
        >
          <option value="">全部状态</option>
          <option value="ACTIVE">启用</option>
          <option value="INACTIVE">停用</option>
          <option value="PENDING">待激活</option>
        </select>
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ds-fg-muted" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            placeholder="搜索姓名或账号..."
            className="w-full rounded-md border border-ds-border bg-ds-surface py-1.5 pl-10 pr-4 text-sm text-ds-fg outline-none transition-colors placeholder:text-ds-fg-subtle focus:border-ds-primary focus:ring-2 focus:ring-ds-primary/20"
          />
        </div>
      </div>

      {/* 批量操作栏 */}
      {selectedUsers.size > 0 && (
        <div className="flex items-center gap-4 rounded-lg bg-ds-surface p-3">
          <span className="text-sm text-ds-fg">已选择 {selectedUsers.size} 个用户</span>
          <button
            onClick={() => setResetConfirm(true)}
            disabled={resetPasswordMutation.isPending}
            className="flex items-center gap-1 rounded-md border border-ds-border bg-ds-surface px-3 py-1.5 text-sm text-ds-fg transition-colors hover:bg-ds-surface-2"
          >
            <Key className="h-4 w-4" />
            重置密码
          </button>
          <button
            onClick={() => setSelectedUsers(new Set())}
            className="ml-auto text-sm text-ds-fg-muted transition-colors hover:text-ds-fg"
          >
            取消选择
          </button>
        </div>
      )}

      {/* 用户列表 */}
      <div className="surface-card overflow-hidden">
        <table className="w-full">
          <thead className="bg-ds-surface">
            <tr className="border-b border-ds-border">
              <th className="px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={users.length > 0 && selectedUsers.size === users.length}
                  onChange={handleSelectAll}
                  className="h-4 w-4"
                />
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-ds-fg-muted">账号</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-ds-fg-muted">姓名</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-ds-fg-muted">角色</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-ds-fg-muted">学号/工号</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-ds-fg-muted">状态</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-ds-fg-muted">操作</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-ds-fg-muted">
                  加载中...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-ds-fg-muted">
                  暂无用户数据
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="border-b border-ds-divider transition-colors hover:bg-ds-surface">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedUsers.has(user.id)}
                      onChange={() => handleSelectUser(user.id)}
                      className="h-4 w-4"
                    />
                  </td>
                  <td className="px-4 py-3 text-sm text-ds-fg">{user.account}</td>
                  <td className="px-4 py-3 text-sm font-medium text-ds-fg">{user.name}</td>
                  <td className="px-4 py-3 text-sm text-ds-fg-muted">{user.roleName || roles?.find(r => r.code === user.role)?.name || user.role}</td>
                  <td className="px-4 py-3 text-sm text-ds-fg-muted">
                    {user.student?.studentNo || user.teacher?.teacherNo || '-'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-sm ${statusMap[user.status]?.color || ''}`}>
                      {statusMap[user.status]?.label || user.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openDetailModal(user)}
                        className="rounded p-1.5 text-ds-fg-muted transition-colors hover:bg-ds-surface-2 hover:text-ds-primary"
                        title="查看详情"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setShowRoleModal(true);
                        }}
                        className="rounded p-1.5 text-ds-fg-muted transition-colors hover:bg-ds-surface-2 hover:text-ds-primary"
                        title="分配角色"
                      >
                        <Shield className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() =>
                          updateStatusMutation.mutate({
                            id: user.id,
                            status: user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE',
                          })
                        }
                        className="rounded p-1.5 text-ds-fg-muted transition-colors hover:bg-ds-surface-2 hover:text-ds-fg"
                        title={user.status === 'ACTIVE' ? '停用' : '启用'}
                      >
                        {user.status === 'ACTIVE' ? (
                          <PowerOff className="h-4 w-4" />
                        ) : (
                          <Power className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-ds-border px-4 py-3">
            <div className="text-sm text-ds-fg-muted">
              共 {totalUsers} 条记录，第 {pagination.page} / {totalPages} 页
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                disabled={pagination.page === 1}
                className="flex items-center gap-1 rounded-md border border-ds-border bg-ds-surface px-3 py-1.5 text-sm text-ds-fg transition-colors hover:bg-ds-surface-2 disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
                上一页
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum = i + 1;
                  if (totalPages > 5) {
                    if (pagination.page > 3) {
                      pageNum = pagination.page - 2 + i;
                    }
                    if (pageNum > totalPages) {
                      pageNum = totalPages - 4 + i;
                    }
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPagination({ ...pagination, page: pageNum })}
                      className={`min-w-[32px] rounded-md px-2 py-1.5 text-sm transition-colors ${
                        pagination.page === pageNum
                          ? 'bg-ds-primary text-white'
                          : 'border border-ds-border bg-ds-surface text-ds-fg hover:bg-ds-surface-2'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                disabled={pagination.page === totalPages}
                className="flex items-center gap-1 rounded-md border border-ds-border bg-ds-surface px-3 py-1.5 text-sm text-ds-fg transition-colors hover:bg-ds-surface-2 disabled:opacity-50"
              >
                下一页
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 导入弹窗 */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ds-overlay/50 backdrop-blur-sm">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto glass-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-ds-fg">批量导入用户</h2>
              <button onClick={() => setShowImportModal(false)} className="text-ds-fg-muted transition-colors hover:text-ds-fg">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* 导入类型选择 */}
              <div className="flex gap-4">
                <button
                  onClick={() => setImportType('STUDENT')}
                  className={`flex-1 rounded-lg border p-4 text-center transition-colors ${
                    importType === 'STUDENT' ? 'border-ds-primary bg-ds-primary/5' : 'border-ds-border hover:bg-ds-surface-2'
                  }`}
                >
                  <Users className="mx-auto mb-2 h-8 w-8 text-ds-fg" />
                  <div className="font-medium text-ds-fg">导入学生</div>
                </button>
                <button
                  onClick={() => setImportType('TEACHER')}
                  className={`flex-1 rounded-lg border p-4 text-center transition-colors ${
                    importType === 'TEACHER' ? 'border-ds-primary bg-ds-primary/5' : 'border-ds-border hover:bg-ds-surface-2'
                  }`}
                >
                  <Users className="mx-auto mb-2 h-8 w-8 text-ds-fg" />
                  <div className="font-medium text-ds-fg">导入教师</div>
                </button>
              </div>

              {/* 模板下载 */}
              <div className="rounded-md bg-ds-surface p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-ds-fg">模板格式说明：</span>
                  <button
                    onClick={() => downloadTemplate(importType)}
                    className="flex items-center gap-1 text-sm text-ds-primary hover:underline"
                  >
                    <Download className="h-4 w-4" />
                    下载模板
                  </button>
                </div>
                <p className="mt-1 text-xs text-ds-fg-muted">
                  {importType === 'STUDENT'
                    ? '必需字段：学号、姓名、性别、入学年份、年级ID、班级ID'
                    : '必需字段：工号、姓名、角色（可选：SUBJECT_TEACHER/CLASS_TEACHER/GRADE_ADMIN）'}
                </p>
              </div>

              {/* 文件上传 */}
              <div>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-ds-border bg-ds-surface p-8 transition-colors hover:border-ds-primary hover:bg-ds-surface-2"
                >
                  <FileSpreadsheet className="mb-2 h-10 w-10 text-ds-fg-muted" />
                  <p className="text-sm text-ds-fg-muted">
                    {importData.file ? importData.file.name : '点击上传或拖拽CSV文件到此处'}
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              {/* 数据预览 */}
              {importData.preview.length > 0 && (
                <div>
                  <h3 className="mb-2 text-sm font-medium text-ds-fg">数据预览（前5行）</h3>
                  <div className="surface-card overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-ds-surface">
                        <tr className="border-b border-ds-border">
                          {Object.keys(importData.preview[0]).map((key) => (
                            <th key={key} className="px-3 py-2 text-left text-ds-fg-muted">
                              {key}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {importData.preview.map((row, i) => (
                          <tr key={i} className="border-b border-ds-divider">
                            {Object.values(row).map((value: any, j) => (
                              <td key={j} className="px-3 py-2 text-ds-fg">
                                {value}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 操作按钮 */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowImportModal(false)}
                  className="flex-1 rounded-md border border-ds-border bg-ds-surface px-4 py-2 text-sm font-medium text-ds-fg transition-colors hover:bg-ds-surface-2"
                >
                  取消
                </button>
                <button
                  onClick={handleImport}
                  disabled={!importData.file || importMutation.isPending}
                  className="flex-1 rounded-md bg-ds-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-ds-primary/90 disabled:opacity-50"
                >
                  {importMutation.isPending ? '导入中...' : '开始导入'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 用户详情弹窗 */}
      {showDetailModal && detailUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ds-overlay/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto glass-card p-6">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-ds-primary/10">
                  {userDetail?.student ? (
                    <GraduationCap className="h-6 w-6 text-ds-primary" />
                  ) : (
                    <UserCircle className="h-6 w-6 text-ds-primary" />
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-ds-fg">{userDetail?.name || detailUser.name}</h2>
                  <p className="text-sm text-ds-fg-muted">
                    {userDetail?.roleName || detailUser.roleName || detailUser.role} · {userDetail?.account || detailUser.account}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setShowDetailModal(false);
                  setDetailUser(null);
                }} 
                className="text-ds-fg-muted transition-colors hover:text-ds-fg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {detailLoading ? (
              <div className="py-12 text-center text-ds-fg-muted">
                <div className="animate-spin h-8 w-8 border-2 border-ds-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                <p>加载中...</p>
              </div>
            ) : userDetail ? (
              <div className="space-y-4">
                {/* 基本信息 */}
                <div className="rounded-lg border border-ds-border overflow-hidden">
                  <button
                    onClick={() => toggleSection('basic')}
                    className="w-full flex items-center justify-between p-4 bg-ds-surface hover:bg-ds-surface-2 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <UserCircle className="h-5 w-5 text-ds-primary" />
                      <span className="font-medium text-ds-fg">基本信息</span>
                    </div>
                    {expandedSections.has('basic') ? (
                      <ChevronUp className="h-4 w-4 text-ds-fg-muted" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-ds-fg-muted" />
                    )}
                  </button>
                  {expandedSections.has('basic') && (
                    <div className="p-4 space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-ds-fg-muted mb-1">账号</p>
                          <p className="text-sm text-ds-fg font-medium">{userDetail.account}</p>
                        </div>
                        <div>
                          <p className="text-xs text-ds-fg-muted mb-1">姓名</p>
                          <p className="text-sm text-ds-fg font-medium">{userDetail.name}</p>
                        </div>
                        <div>
                          <p className="text-xs text-ds-fg-muted mb-1">角色</p>
                          <p className="text-sm text-ds-fg font-medium">{userDetail.roleName || userDetail.role}</p>
                        </div>
                        <div>
                          <p className="text-xs text-ds-fg-muted mb-1">状态</p>
                          <span className={`text-sm ${statusMap[userDetail.status]?.color || ''}`}>
                            {statusMap[userDetail.status]?.label || userDetail.status}
                          </span>
                        </div>
                      </div>
                      {userDetail.student && (
                        <div className="pt-3 border-t border-ds-border mt-3">
                          <p className="text-xs text-ds-fg-muted mb-2">学生信息</p>
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <p className="text-xs text-ds-fg-muted">学号</p>
                              <p className="text-sm text-ds-fg">{userDetail.student.studentNo}</p>
                            </div>
                            <div>
                              <p className="text-xs text-ds-fg-muted">年级</p>
                              <p className="text-sm text-ds-fg">{userDetail.student.grade?.name || '-'}</p>
                            </div>
                            <div>
                              <p className="text-xs text-ds-fg-muted">班级</p>
                              <p className="text-sm text-ds-fg">{userDetail.student.class?.name || '-'}</p>
                            </div>
                          </div>
                        </div>
                      )}
                      {userDetail.teacher && (
                        <div className="pt-3 border-t border-ds-border mt-3">
                          <p className="text-xs text-ds-fg-muted mb-2">教师信息</p>
                          <div>
                            <p className="text-xs text-ds-fg-muted">工号</p>
                            <p className="text-sm text-ds-fg">{userDetail.teacher.teacherNo}</p>
                          </div>
                          {userDetail.teacher.teacherClasses && userDetail.teacher.teacherClasses.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs text-ds-fg-muted mb-1">任课信息</p>
                              <div className="flex flex-wrap gap-2">
                                {userDetail.teacher.teacherClasses.map((tc, idx) => (
                                  <span key={idx} className="text-xs bg-ds-surface-2 px-2 py-1 rounded">
                                    {tc.class.grade?.name}{tc.class.name} · {tc.subject?.name || '未分配学科'}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 数据权限范围 */}
                <div className="rounded-lg border border-ds-border overflow-hidden">
                  <button
                    onClick={() => toggleSection('scopes')}
                    className="w-full flex items-center justify-between p-4 bg-ds-surface hover:bg-ds-surface-2 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-ds-primary" />
                      <span className="font-medium text-ds-fg">数据权限范围</span>
                    </div>
                    {expandedSections.has('scopes') ? (
                      <ChevronUp className="h-4 w-4 text-ds-fg-muted" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-ds-fg-muted" />
                    )}
                  </button>
                  {expandedSections.has('scopes') && (
                    <div className="p-4 space-y-4">
                      {userDetail.dataScopes && userDetail.dataScopes.length > 0 ? (
                        <>
                          {/* 年级权限 */}
                          {userDetail.dataScopes.some(s => s.scopeType === 'GRADE') && (
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <School className="h-4 w-4 text-ds-primary" />
                                <span className="text-sm font-medium text-ds-fg">年级权限</span>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {userDetail.dataScopes
                                  .filter(s => s.scopeType === 'GRADE')
                                  .map((scope, idx) => (
                                    <span key={idx} className="text-xs bg-ds-primary/10 text-ds-primary px-2 py-1 rounded">
                                      {scope.grade?.name || scope.scopeId}
                                    </span>
                                  ))}
                              </div>
                            </div>
                          )}
                          {/* 班级权限 */}
                          {userDetail.dataScopes.some(s => s.scopeType === 'CLASS') && (
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <Users className="h-4 w-4 text-ds-primary" />
                                <span className="text-sm font-medium text-ds-fg">班级权限</span>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {userDetail.dataScopes
                                  .filter(s => s.scopeType === 'CLASS')
                                  .map((scope, idx) => (
                                    <span key={idx} className="text-xs bg-ds-surface-2 px-2 py-1 rounded">
                                      {scope.class?.grade?.name}{scope.class?.name || scope.scopeId}
                                    </span>
                                  ))}
                              </div>
                            </div>
                          )}
                          {/* 学科权限 */}
                          {userDetail.dataScopes.some(s => s.scopeType === 'SUBJECT') && (
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <BookOpen className="h-4 w-4 text-ds-primary" />
                                <span className="text-sm font-medium text-ds-fg">学科权限</span>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {userDetail.dataScopes
                                  .filter(s => s.scopeType === 'SUBJECT')
                                  .map((scope, idx) => (
                                    <span key={idx} className="text-xs bg-ds-surface-2 px-2 py-1 rounded">
                                      {scope.subject?.name || scope.scopeId}
                                    </span>
                                  ))}
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <p className="text-sm text-ds-fg-muted text-center py-4">暂无数据权限配置</p>
                      )}
                    </div>
                  )}
                </div>

                {/* 快捷操作 */}
                <div className="flex gap-3 pt-4 border-t border-ds-border">
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      setSelectedUser(userDetail);
                      setShowRoleModal(true);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 rounded-md border border-ds-border bg-ds-surface px-4 py-2 text-sm font-medium text-ds-fg transition-colors hover:bg-ds-surface-2"
                  >
                    <Shield className="h-4 w-4" />
                    分配角色
                  </button>
                  <button
                    onClick={() => {
                      updateStatusMutation.mutate({
                        id: userDetail.id,
                        status: userDetail.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE',
                      });
                    }}
                    className="flex-1 flex items-center justify-center gap-2 rounded-md border border-ds-border bg-ds-surface px-4 py-2 text-sm font-medium text-ds-fg transition-colors hover:bg-ds-surface-2"
                  >
                    {userDetail.status === 'ACTIVE' ? (
                      <><PowerOff className="h-4 w-4" /> 停用账号</>
                    ) : (
                      <><Power className="h-4 w-4" /> 启用账号</>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      resetPasswordMutation.mutate([userDetail.id]);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 rounded-md bg-ds-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-ds-primary/90"
                  >
                    <Key className="h-4 w-4" />
                    重置密码
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-ds-fg-muted">
                <p>加载失败，请重试</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 分配角色弹窗 */}
      {showRoleModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ds-overlay/50 backdrop-blur-sm">
          <div className="w-full max-w-md glass-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-ds-fg">分配角色 - {selectedUser.name}</h2>
              <button onClick={() => setShowRoleModal(false)} className="text-ds-fg-muted transition-colors hover:text-ds-fg">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3">
              {roles?.length === 0 ? (
                <div className="py-8 text-center text-ds-fg-muted">
                  <p>暂无角色数据</p>
                  <p className="mt-1 text-sm">请先在角色权限页面创建角色</p>
                </div>
              ) : (
                roles?.map((role) => (
                  <button
                    key={role.id}
                    onClick={() => assignRoleMutation.mutate({ id: selectedUser.id, roleId: role.id })}
                    disabled={assignRoleMutation.isPending}
                    className={`w-full rounded-md border p-3 text-left transition-colors ${
                      selectedUser.role === role.code
                        ? 'border-ds-primary bg-ds-primary/10 text-ds-primary'
                        : 'border-ds-border hover:bg-ds-surface-2'
                    }`}
                  >
                    <div className="font-medium">{role.name}</div>
                    <div className="text-xs text-ds-fg-muted">{role.code}</div>
                    {role.description && (
                      <div className="mt-1 text-xs text-ds-fg-muted">{role.description}</div>
                    )}
                  </button>
                ))
              )}
            </div>
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => setShowRoleModal(false)}
                className="flex-1 rounded-md border border-ds-border bg-ds-surface px-4 py-2 text-sm font-medium text-ds-fg transition-colors hover:bg-ds-surface-2"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 重置密码确认弹窗 */}
      <AlertDialog open={resetConfirm} onOpenChange={setResetConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认重置密码</AlertDialogTitle>
            <AlertDialogDescription>
              确定要重置 {selectedUsers.size} 个用户的密码吗？此操作不可撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setResetConfirm(false)}>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleResetPassword}>确认重置</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
