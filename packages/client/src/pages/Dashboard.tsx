import { useAuthStore } from '@/stores/authStore';
import { Users, GraduationCap, BookOpen, TrendingUp } from 'lucide-react';

const statCards = [
  { label: '学生总数', value: '1,234', icon: Users, color: 'text-ds-primary' },
  { label: '班级数量', value: '36', icon: GraduationCap, color: 'text-ds-success' },
  { label: '本学期考试', value: '8', icon: BookOpen, color: 'text-ds-warning' },
  { label: '临界生', value: '45', icon: TrendingUp, color: 'text-ds-danger' },
];

export default function Dashboard() {
  const { user } = useAuthStore();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ds-fg">
          欢迎回来，{user?.name}
        </h1>
        <p className="mt-1 text-ds-fg-muted">
          今天是 {new Date().toLocaleDateString('zh-CN', { weekday: 'long' })}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className="surface-card-2 flex items-center gap-4 p-4"
          >
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-md bg-ds-surface ${stat.color}`}
            >
              <stat.icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-ds-fg-muted">{stat.label}</p>
              <p className="text-2xl font-semibold text-ds-fg tabular-nums">
                {stat.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="surface-card p-6">
          <h2 className="mb-4 text-lg font-semibold text-ds-fg">待办事项</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-md bg-ds-surface p-3">
              <span className="text-sm text-ds-fg">待审批请假申请</span>
              <span className="rounded-full bg-ds-warning/20 px-2 py-0.5 text-xs text-ds-warning">
                3
              </span>
            </div>
            <div className="flex items-center justify-between rounded-md bg-ds-surface p-3">
              <span className="text-sm text-ds-fg">德育事件待复核</span>
              <span className="rounded-full bg-ds-danger/20 px-2 py-0.5 text-xs text-ds-danger">
                5
              </span>
            </div>
            <div className="flex items-center justify-between rounded-md bg-ds-surface p-3">
              <span className="text-sm text-ds-fg">成绩导入任务</span>
              <span className="rounded-full bg-ds-info/20 px-2 py-0.5 text-xs text-ds-info">
                1
              </span>
            </div>
          </div>
        </div>

        <div className="surface-card p-6">
          <h2 className="mb-4 text-lg font-semibold text-ds-fg">预警摘要</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-md bg-ds-surface p-3">
              <span className="text-sm text-ds-fg">德育预警学生</span>
              <span className="text-sm font-medium text-ds-danger">12人</span>
            </div>
            <div className="flex items-center justify-between rounded-md bg-ds-surface p-3">
              <span className="text-sm text-ds-fg">成绩临界生</span>
              <span className="text-sm font-medium text-ds-warning">45人</span>
            </div>
            <div className="flex items-center justify-between rounded-md bg-ds-surface p-3">
              <span className="text-sm text-ds-fg">偏科生</span>
              <span className="text-sm font-medium text-ds-info">28人</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
