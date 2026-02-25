import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import {
  Shield,
  Plus,
  Copy,
  Edit2,
  Trash2,
  X,
  ChevronRight,
  ChevronDown,
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

interface Role {
  id: string;
  name: string;
  code: string;
  description?: string;
  permissions: string[];
  isSystem: boolean;
  createdAt: string;
}

interface Menu {
  id: string;
  name: string;
  path: string;
  icon: string;
  permissions: string[];
}

const permissionLabels: Record<string, string> = {
  view: '查看',
  create: '新增',
  edit: '编辑',
  delete: '删除',
  import: '导入',
  export: '导出',
  'reset-password': '重置密码',
};

export default function Roles() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SCHOOL_ADMIN';

  const [showModal, setShowModal] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Role | null>(null);
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
  });
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());

  // 获取角色列表
  const { data: roles } = useQuery<Role[]>({
    queryKey: ['roles'],
    queryFn: async () => {
      const res = await api.get('/roles');
      return res.data;
    },
    enabled: isAdmin,
  });

  // 获取菜单列表
  const { data: menus } = useQuery<Menu[]>({
    queryKey: ['menus'],
    queryFn: async () => {
      const res = await api.get('/roles/menu/list');
      return res.data;
    },
    enabled: isAdmin,
  });

  // 创建角色
  const createMutation = useMutation({
    mutationFn: (data: typeof formData) => api.post('/roles', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setShowModal(false);
      setFormData({ name: '', code: '', description: '' });
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || '创建失败');
    },
  });

  // 复制角色
  const copyMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name: string; code: string } }) =>
      api.post(`/roles/${id}/copy`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || '复制失败');
    },
  });

  // 更新角色
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<typeof formData> }) =>
      api.patch(`/roles/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setShowModal(false);
      setEditingRole(null);
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || '更新失败');
    },
  });

  // 删除角色
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/roles/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || '删除失败');
    },
  });

  // 设置权限
  const setPermissionsMutation = useMutation({
    mutationFn: ({ id, permissions }: { id: string; permissions: string[] }) =>
      api.post(`/roles/${id}/permissions`, { permissions }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setShowPermissionModal(false);
      setSelectedRole(null);
      setSelectedPermissions(new Set());
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || '设置权限失败');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingRole) {
      updateMutation.mutate({ id: editingRole.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (role: Role) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      code: role.code,
      description: role.description || '',
    });
    setShowModal(true);
  };

  const handleCopy = (role: Role) => {
    const newName = `${role.name} (复制)`;
    const newCode = `${role.code}_COPY_${Date.now()}`;
    copyMutation.mutate({ id: role.id, data: { name: newName, code: newCode } });
  };

  const handleSetPermissions = (role: Role) => {
    setSelectedRole(role);
    setSelectedPermissions(new Set(role.permissions));
    setShowPermissionModal(true);
  };

  const toggleMenu = (menuId: string) => {
    const newExpanded = new Set(expandedMenus);
    if (newExpanded.has(menuId)) {
      newExpanded.delete(menuId);
    } else {
      newExpanded.add(menuId);
    }
    setExpandedMenus(newExpanded);
  };

  const togglePermission = (permission: string) => {
    const newPermissions = new Set(selectedPermissions);
    if (newPermissions.has(permission)) {
      newPermissions.delete(permission);
    } else {
      newPermissions.add(permission);
    }
    setSelectedPermissions(newPermissions);
  };

  const toggleMenuPermissions = (menu: Menu, checked: boolean) => {
    const newPermissions = new Set(selectedPermissions);
    menu.permissions.forEach((perm) => {
      const permKey = `${menu.id}:${perm}`;
      if (checked) {
        newPermissions.add(permKey);
      } else {
        newPermissions.delete(permKey);
      }
    });
    setSelectedPermissions(newPermissions);
  };

  const handleSavePermissions = () => {
    if (!selectedRole) return;
    setPermissionsMutation.mutate({
      id: selectedRole.id,
      permissions: Array.from(selectedPermissions),
    });
  };

  const handleDelete = () => {
    if (deleteConfirm) {
      deleteMutation.mutate(deleteConfirm.id);
      setDeleteConfirm(null);
    }
  };

  // 计算权限数量（处理通配符 '*' 的情况）
  const calculatePermissionCount = (role: Role) => {
    // 确保 permissions 是数组
    let permissions = role.permissions;
    if (typeof permissions === 'string') {
      try {
        permissions = JSON.parse(permissions);
      } catch {
        permissions = [];
      }
    }
    if (!permissions || !Array.isArray(permissions) || permissions.length === 0) return 0;
    // 如果包含通配符 '*'，计算所有菜单权限的总数
    if (permissions.includes('*')) {
      return menus?.reduce((total, menu) => total + menu.permissions.length, 0) || 0;
    }
    return permissions.length;
  };

  if (!isAdmin) {
    return (
      <div className="p-6">
        <div className="py-12 text-center">
          <Shield className="mx-auto mb-4 h-16 w-16 text-ds-fg-muted" />
          <h2 className="mb-2 text-xl font-semibold text-ds-fg">权限不足</h2>
          <p className="text-ds-fg-muted">只有管理员可以管理角色权限</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ds-fg">角色权限</h1>
        <button
          onClick={() => {
            setEditingRole(null);
            setFormData({ name: '', code: '', description: '' });
            setShowModal(true);
          }}
          className="flex items-center gap-2 rounded-md bg-ds-primary px-4 py-2 text-sm text-white transition-colors hover:bg-ds-primary/90"
        >
          <Plus className="h-4 w-4" />
          新建角色
        </button>
      </div>

      {/* 角色列表 */}
      <div className="surface-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-ds-border bg-ds-surface">
              <th className="px-4 py-3 text-left text-sm font-medium text-ds-fg-muted">角色名称</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-ds-fg-muted">角色编码</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-ds-fg-muted">描述</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-ds-fg-muted">权限数量</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-ds-fg-muted">操作</th>
            </tr>
          </thead>
          <tbody>
            {roles?.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-ds-fg-muted">
                  暂无角色数据
                </td>
              </tr>
            ) : (
              roles?.map((role) => (
                <tr key={role.id} className="border-b border-ds-divider transition-colors hover:bg-ds-surface">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-ds-fg">{role.name}</span>
                      {role.isSystem && (
                        <span className="rounded bg-ds-primary/20 px-1.5 py-0.5 text-[10px] font-medium text-ds-primary">
                          内置
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-ds-fg-muted">{role.code}</td>
                  <td className="px-4 py-3 text-sm text-ds-fg-muted">{role.description || '-'}</td>
                  <td className="px-4 py-3 text-sm text-ds-fg-muted">{calculatePermissionCount(role)} 项</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleSetPermissions(role)}
                        className="rounded p-1.5 text-ds-fg-muted transition-colors hover:bg-ds-surface-2 hover:text-ds-primary"
                        title="配置权限"
                      >
                        <Shield className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleCopy(role)}
                        className="rounded p-1.5 text-ds-fg-muted transition-colors hover:bg-ds-surface-2 hover:text-ds-fg"
                        title="复制角色"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(role)}
                        className="rounded p-1.5 text-ds-fg-muted transition-colors hover:bg-ds-surface-2 hover:text-ds-fg"
                        title="编辑"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      {!role.isSystem && (
                        <button
                          onClick={() => setDeleteConfirm(role)}
                          className="rounded p-1.5 text-ds-fg-muted transition-colors hover:bg-ds-danger/20 hover:text-ds-danger"
                          title="删除"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 新建/编辑角色弹窗 */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ds-overlay/50 backdrop-blur-sm">
          <div className="w-full max-w-md glass-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-ds-fg">{editingRole ? '编辑角色' : '新建角色'}</h2>
              <button onClick={() => setShowModal(false)} className="text-ds-fg-muted transition-colors hover:text-ds-fg">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm text-ds-fg-muted">角色名称</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-md border border-ds-border bg-ds-surface px-4 py-2.5 text-ds-fg outline-none transition-colors placeholder:text-ds-fg-subtle focus:border-ds-primary focus:ring-2 focus:ring-ds-primary/20"
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-ds-fg-muted">角色编码</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full rounded-md border border-ds-border bg-ds-surface px-4 py-2.5 text-ds-fg outline-none transition-colors placeholder:text-ds-fg-subtle focus:border-ds-primary focus:ring-2 focus:ring-ds-primary/20"
                  required
                  disabled={!!editingRole}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-ds-fg-muted">描述</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded-md border border-ds-border bg-ds-surface px-4 py-2.5 text-ds-fg outline-none transition-colors placeholder:text-ds-fg-subtle focus:border-ds-primary focus:ring-2 focus:ring-ds-primary/20"
                  rows={3}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 rounded-md border border-ds-border bg-ds-surface px-4 py-2 text-sm font-medium text-ds-fg transition-colors hover:bg-ds-surface-2"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-1 rounded-md bg-ds-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-ds-primary/90 disabled:opacity-50"
                >
                  {createMutation.isPending || updateMutation.isPending ? '保存中...' : '保存'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 权限配置弹窗 */}
      {showPermissionModal && selectedRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ds-overlay/50 backdrop-blur-sm">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto glass-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-ds-fg">配置权限 - {selectedRole.name}</h2>
              <button onClick={() => setShowPermissionModal(false)} className="text-ds-fg-muted transition-colors hover:text-ds-fg">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-2">
              {menus?.map((menu) => (
                <div key={menu.id} className="rounded-md border border-ds-border">
                  <div
                    className="flex cursor-pointer items-center justify-between p-3 transition-colors hover:bg-ds-surface"
                    onClick={() => toggleMenu(menu.id)}
                  >
                    <div className="flex items-center gap-3">
                      {expandedMenus.has(menu.id) ? (
                        <ChevronDown className="h-4 w-4 text-ds-fg-muted" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-ds-fg-muted" />
                      )}
                      <span className="font-medium text-ds-fg">{menu.name}</span>
                    </div>
                    <label className="flex items-center gap-2 text-sm text-ds-fg-muted">
                      <input
                        type="checkbox"
                        checked={menu.permissions.every((p) => selectedPermissions.has(`${menu.id}:${p}`))}
                        onChange={(e) => toggleMenuPermissions(menu, e.target.checked)}
                        onClick={(e) => e.stopPropagation()}
                        className="h-4 w-4"
                      />
                      全选
                    </label>
                  </div>

                  {expandedMenus.has(menu.id) && (
                    <div className="grid grid-cols-3 gap-2 px-4 pb-3 pl-10">
                      {menu.permissions.map((perm) => {
                        const permKey = `${menu.id}:${perm}`;
                        return (
                          <label key={permKey} className="flex items-center gap-2 text-sm text-ds-fg">
                            <input
                              type="checkbox"
                              checked={selectedPermissions.has(permKey)}
                              onChange={() => togglePermission(permKey)}
                              className="h-4 w-4"
                            />
                            {permissionLabels[perm] || perm}
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-4 flex gap-3 border-t border-ds-border pt-4">
              <button
                onClick={() => setShowPermissionModal(false)}
                className="flex-1 rounded-md border border-ds-border bg-ds-surface px-4 py-2 text-sm font-medium text-ds-fg transition-colors hover:bg-ds-surface-2"
              >
                取消
              </button>
              <button
                onClick={handleSavePermissions}
                disabled={setPermissionsMutation.isPending}
                className="flex-1 rounded-md bg-ds-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-ds-primary/90 disabled:opacity-50"
              >
                {setPermissionsMutation.isPending ? '保存中...' : '保存权限'}
              </button>
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
              确定要删除角色「{deleteConfirm?.name}」吗？此操作不可撤销。
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
