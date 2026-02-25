import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import {
  Settings,
  School,
  Database,
  FileText,
  Info,
  Save,
  RefreshCw,
  Download,
  Upload,
  AlertTriangle,
  Check,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { Modal } from '@/components/ui/modal';

interface SystemConfig {
  id: string;
  key: string;
  value: string;
  description: string;
  category: string;
  updatedAt: string;
}

export default function SettingsPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SCHOOL_ADMIN';
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState('school');
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [restoreFile, setRestoreFile] = useState<File | null>(null);

  // 学校信息表单
  const [schoolForm, setSchoolForm] = useState({
    schoolName: '示例中学',
    schoolYear: '2024-2025',
    currentTerm: '1',
    principalName: '',
    contactPhone: '',
    address: '',
  });

  // 获取系统配置
  const { data: configs } = useQuery<SystemConfig[]>({
    queryKey: ['system-configs'],
    queryFn: async () => {
      const res = await fetch('/api/settings/configs', {
        headers: {
          Authorization: `Bearer ${useAuthStore.getState().token}`,
        },
      });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: isAdmin,
  });

  // 保存学校信息
  const saveSchoolMutation = useMutation({
    mutationFn: async (data: typeof schoolForm) => {
      const res = await fetch('/api/settings/school', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${useAuthStore.getState().token}`,
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('保存失败');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-configs'] });
      alert('保存成功！');
    },
    onError: (error: any) => {
      alert(error.message || '保存失败');
    },
  });

  // 备份数据库
  const backupMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/settings/backup', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${useAuthStore.getState().token}`,
        },
      });
      if (!res.ok) throw new Error('备份失败');
      return res.blob();
    },
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup_${new Date().toISOString().slice(0, 10)}.sql`;
      a.click();
      window.URL.revokeObjectURL(url);
      setShowBackupModal(false);
    },
    onError: (error: any) => {
      alert(error.message || '备份失败');
    },
  });

  // 恢复数据库
  const restoreMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/settings/restore', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${useAuthStore.getState().token}`,
        },
        body: formData,
      });
      if (!res.ok) throw new Error('恢复失败');
      return res.json();
    },
    onSuccess: () => {
      alert('恢复成功！系统将重新加载...');
      setShowRestoreModal(false);
      window.location.reload();
    },
    onError: (error: any) => {
      alert(error.message || '恢复失败');
    },
  });

  if (!isAdmin) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <Settings className="w-16 h-16 text-ds-fg-muted mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-ds-fg mb-2">权限不足</h2>
          <p className="text-ds-fg-muted">只有管理员可以访问系统设置</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ds-fg">系统设置</h1>
          <p className="text-sm text-ds-fg-muted mt-1">管理系统参数、数据备份与恢复</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 lg:w-[500px]">
          <TabsTrigger value="school" className="flex items-center gap-2">
            <School className="w-4 h-4" />
            学校信息
          </TabsTrigger>
          <TabsTrigger value="params" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            系统参数
          </TabsTrigger>
          <TabsTrigger value="backup" className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            数据备份
          </TabsTrigger>
          <TabsTrigger value="about" className="flex items-center gap-2">
            <Info className="w-4 h-4" />
            关于系统
          </TabsTrigger>
        </TabsList>

        {/* 学校信息 */}
        <TabsContent value="school" className="space-y-4">
          <div className="surface-card border border-ds-border rounded-lg p-6">
            <h3 className="text-lg font-semibold text-ds-fg mb-4">学校基本信息</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                saveSchoolMutation.mutate(schoolForm);
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-ds-fg mb-1">学校名称</label>
                  <input
                    type="text"
                    value={schoolForm.schoolName}
                    onChange={(e) => setSchoolForm({ ...schoolForm, schoolName: e.target.value })}
                    className="w-full px-3 py-2 border border-ds-border rounded-md bg-ds-surface text-ds-fg focus:outline-none focus:ring-2 focus:ring-ds-primary/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ds-fg mb-1">校长姓名</label>
                  <input
                    type="text"
                    value={schoolForm.principalName}
                    onChange={(e) => setSchoolForm({ ...schoolForm, principalName: e.target.value })}
                    className="w-full px-3 py-2 border border-ds-border rounded-md bg-ds-surface text-ds-fg focus:outline-none focus:ring-2 focus:ring-ds-primary/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ds-fg mb-1">当前学年</label>
                  <input
                    type="text"
                    value={schoolForm.schoolYear}
                    onChange={(e) => setSchoolForm({ ...schoolForm, schoolYear: e.target.value })}
                    className="w-full px-3 py-2 border border-ds-border rounded-md bg-ds-surface text-ds-fg focus:outline-none focus:ring-2 focus:ring-ds-primary/50"
                    placeholder="如：2024-2025"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ds-fg mb-1">当前学期</label>
                  <select
                    value={schoolForm.currentTerm}
                    onChange={(e) => setSchoolForm({ ...schoolForm, currentTerm: e.target.value })}
                    className="w-full px-3 py-2 border border-ds-border rounded-md bg-ds-surface text-ds-fg focus:outline-none focus:ring-2 focus:ring-ds-primary/50"
                  >
                    <option value="1">第一学期</option>
                    <option value="2">第二学期</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-ds-fg mb-1">联系电话</label>
                  <input
                    type="text"
                    value={schoolForm.contactPhone}
                    onChange={(e) => setSchoolForm({ ...schoolForm, contactPhone: e.target.value })}
                    className="w-full px-3 py-2 border border-ds-border rounded-md bg-ds-surface text-ds-fg focus:outline-none focus:ring-2 focus:ring-ds-primary/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ds-fg mb-1">学校地址</label>
                  <input
                    type="text"
                    value={schoolForm.address}
                    onChange={(e) => setSchoolForm({ ...schoolForm, address: e.target.value })}
                    className="w-full px-3 py-2 border border-ds-border rounded-md bg-ds-surface text-ds-fg focus:outline-none focus:ring-2 focus:ring-ds-primary/50"
                  />
                </div>
              </div>
              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={saveSchoolMutation.isPending}
                  className="flex items-center gap-2 px-4 py-2 bg-ds-primary text-ds-fg rounded-md hover:bg-ds-primary/90 disabled:opacity-50 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  {saveSchoolMutation.isPending ? '保存中...' : '保存设置'}
                </button>
              </div>
            </form>
          </div>
        </TabsContent>

        {/* 系统参数 */}
        <TabsContent value="params" className="space-y-4">
          <div className="surface-card border border-ds-border rounded-lg p-6">
            <h3 className="text-lg font-semibold text-ds-fg mb-4">系统参数配置</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-ds-surface-2 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-ds-fg">成绩小数位数</span>
                    <select className="px-2 py-1 border border-ds-border rounded-md bg-ds-surface text-ds-fg text-sm">
                      <option value="0">0位</option>
                      <option value="1">1位</option>
                      <option value="2">2位</option>
                    </select>
                  </div>
                  <p className="text-xs text-ds-fg-muted">成绩显示时保留的小数位数</p>
                </div>
                <div className="p-4 bg-ds-surface-2 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-ds-fg">默认满分</span>
                    <input
                      type="number"
                      defaultValue={100}
                      className="w-20 px-2 py-1 border border-ds-border rounded-md bg-ds-surface text-ds-fg text-sm"
                    />
                  </div>
                  <p className="text-xs text-ds-fg-muted">新建科目时的默认满分值</p>
                </div>
                <div className="p-4 bg-ds-surface-2 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-ds-fg">及格线比例</span>
                    <input
                      type="number"
                      defaultValue={60}
                      className="w-20 px-2 py-1 border border-ds-border rounded-md bg-ds-surface text-ds-fg text-sm"
                    />
                  </div>
                  <p className="text-xs text-ds-fg-muted">及格线占满分的百分比</p>
                </div>
                <div className="p-4 bg-ds-surface-2 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-ds-fg">优秀线比例</span>
                    <input
                      type="number"
                      defaultValue={90}
                      className="w-20 px-2 py-1 border border-ds-border rounded-md bg-ds-surface text-ds-fg text-sm"
                    />
                  </div>
                  <p className="text-xs text-ds-fg-muted">优秀线占满分的百分比</p>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* 数据备份 */}
        <TabsContent value="backup" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="surface-card border border-ds-border rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-ds-primary/20 rounded-lg">
                  <Download className="w-6 h-6 text-ds-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-ds-fg">数据备份</h3>
                  <p className="text-sm text-ds-fg-muted">导出数据库备份文件</p>
                </div>
              </div>
              <p className="text-sm text-ds-fg-muted mb-4">
                备份文件包含所有系统数据，可用于数据恢复。建议定期备份。
              </p>
              <button
                onClick={() => setShowBackupModal(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-ds-primary text-ds-fg rounded-md hover:bg-ds-primary/90 transition-colors"
              >
                <Download className="w-4 h-4" />
                创建备份
              </button>
            </div>

            <div className="surface-card border border-ds-border rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-ds-warning/20 rounded-lg">
                  <Upload className="w-6 h-6 text-ds-warning" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-ds-fg">数据恢复</h3>
                  <p className="text-sm text-ds-fg-muted">从备份文件恢复数据</p>
                </div>
              </div>
              <p className="text-sm text-ds-fg-muted mb-4">
                恢复操作将覆盖当前数据，请谨慎操作。建议先备份当前数据。
              </p>
              <button
                onClick={() => setShowRestoreModal(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-ds-warning text-ds-warning rounded-md hover:bg-ds-warning/10 transition-colors"
              >
                <Upload className="w-4 h-4" />
                选择备份文件
              </button>
            </div>
          </div>

          <div className="surface-card border border-ds-border rounded-lg p-6">
            <h3 className="text-lg font-semibold text-ds-fg mb-4">备份历史</h3>
            <div className="text-center py-8 text-ds-fg-muted">
              <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>暂无备份记录</p>
              <p className="text-sm">创建备份后，记录将显示在这里</p>
            </div>
          </div>
        </TabsContent>

        {/* 关于系统 */}
        <TabsContent value="about" className="space-y-4">
          <div className="surface-card border border-ds-border rounded-lg p-6">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-ds-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <School className="w-10 h-10 text-ds-primary" />
              </div>
              <h2 className="text-2xl font-bold text-ds-fg">K12教务管理系统</h2>
              <p className="text-ds-fg-muted mt-1">版本 1.0.0</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-ds-surface-2 rounded-lg text-center">
                <div className="text-2xl font-bold text-ds-primary">React</div>
                <div className="text-sm text-ds-fg-muted">前端框架</div>
              </div>
              <div className="p-4 bg-ds-surface-2 rounded-lg text-center">
                <div className="text-2xl font-bold text-ds-primary">NestJS</div>
                <div className="text-sm text-ds-fg-muted">后端框架</div>
              </div>
              <div className="p-4 bg-ds-surface-2 rounded-lg text-center">
                <div className="text-2xl font-bold text-ds-primary">MySQL</div>
                <div className="text-sm text-ds-fg-muted">数据库</div>
              </div>
            </div>

            <div className="border-t border-ds-border pt-4">
              <h4 className="font-medium text-ds-fg mb-2">系统功能</h4>
              <ul className="text-sm text-ds-fg-muted space-y-1">
                <li>• 组织架构管理（年级、班级、学生、教师）</li>
                <li>• 宿舍管理（楼栋、房间、床位）</li>
                <li>• 权限管理（用户、角色、数据权限）</li>
                <li>• 考务管理（考试、成绩录入）</li>
                <li>• 成绩分析（统计分析、班级对比、进退步）</li>
                <li>• 字典与规则管理</li>
              </ul>
            </div>

            <div className="border-t border-ds-border pt-4 mt-4">
              <p className="text-sm text-ds-fg-muted text-center">
                © 2024 K12教务管理系统. All rights reserved.
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* 备份确认弹窗 */}
      <AlertDialog open={showBackupModal} onOpenChange={setShowBackupModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认备份数据</AlertDialogTitle>
            <AlertDialogDescription>
              系统将创建数据库备份文件并下载到本地。备份过程可能需要几秒钟时间。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => backupMutation.mutate()}
              disabled={backupMutation.isPending}
            >
              {backupMutation.isPending ? '备份中...' : '确认备份'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 恢复确认弹窗 */}
      <AlertDialog open={showRestoreModal} onOpenChange={setShowRestoreModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-ds-danger">
              <AlertTriangle className="w-5 h-5" />
              警告：数据恢复操作
            </AlertDialogTitle>
            <AlertDialogDescription>
              恢复操作将覆盖当前所有数据，此操作不可撤销！
              <br />
              <br />
              请选择备份文件：
              <input
                type="file"
                accept=".sql"
                onChange={(e) => setRestoreFile(e.target.files?.[0] || null)}
                className="mt-2 w-full text-sm text-ds-fg-muted file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-ds-primary/20 file:text-ds-primary hover:file:bg-ds-primary/30"
              />
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRestoreFile(null)}>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => restoreFile && restoreMutation.mutate(restoreFile)}
              disabled={!restoreFile || restoreMutation.isPending}
              className="bg-ds-danger hover:bg-ds-danger/90"
            >
              {restoreMutation.isPending ? '恢复中...' : '确认恢复'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
