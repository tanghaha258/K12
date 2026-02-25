import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  ClipboardList,
  Settings,
  ChevronLeft,
  School,
  UserCog,
  Building2,
  Shield,
  ChevronDown,
  UsersRound,
  FileSpreadsheet,
  BarChart3,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface SubMenuItem {
  path: string;
  label: string;
}

interface MenuItem {
  path?: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children?: SubMenuItem[];
}

const menuItems: MenuItem[] = [
  { path: '/', icon: LayoutDashboard, label: '工作台' },
  {
    icon: UsersRound,
    label: '组织与人员',
    children: [
      { path: '/grades', label: '年级管理' },
      { path: '/classes', label: '班级管理' },
      { path: '/students', label: '学生管理' },
      { path: '/teachers', label: '教师管理' },
    ],
  },
  {
    icon: Building2,
    label: '宿舍管理',
    children: [
      { path: '/dorms', label: '宿舍楼栋' },
    ],
  },
  {
    icon: Shield,
    label: '权限管理',
    children: [
      { path: '/users', label: '用户管理' },
      { path: '/roles', label: '角色权限' },
      { path: '/datascopes', label: '数据权限' },
    ],
  },
  {
    icon: BookOpen,
    label: '字典与规则',
    children: [
      { path: '/dict', label: '字典管理' },
    ],
  },
  {
    icon: FileSpreadsheet,
    label: '考务中心',
    children: [
      { path: '/exams', label: '考试管理' },
    ],
  },
  {
    icon: BarChart3,
    label: '成绩分析',
    children: [
      { path: '/analysis', label: '综合分析' },
    ],
  },
  {
    icon: ClipboardList,
    label: '德育量化',
    children: [
      { path: '/moral', label: '德育管理' },
      { path: '/moral/entry', label: '德育录入' },
      { path: '/dorm-moral', label: '宿舍德育管理' },
    ],
  },
  { path: '/settings', icon: Settings, label: '系统设置' },
];

function MenuItemComponent({
  item,
  collapsed,
}: {
  item: MenuItem;
  collapsed: boolean;
}) {
  const location = useLocation();
  const [expanded, setExpanded] = useState(() => {
    if (!item.children) return false;
    return item.children.some((child) => location.pathname.startsWith(child.path));
  });

  const isChildActive = item.children?.some(
    (child) => location.pathname.startsWith(child.path)
  );

  if (item.children) {
    return (
      <div className="space-y-1">
        <button
          onClick={() => setExpanded(!expanded)}
          className={cn(
            'flex w-full items-center justify-between rounded-md px-3 py-2.5 text-sm transition-colors',
            isChildActive
              ? 'bg-ds-primary/10 text-ds-primary'
              : 'text-ds-fg-muted hover:bg-ds-surface-2 hover:text-ds-fg'
          )}
        >
          <div className="flex items-center gap-3">
            <item.icon className="h-5 w-5 shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </div>
          {!collapsed && (
            <ChevronDown
              className={cn(
                'h-4 w-4 shrink-0 transition-transform duration-200',
                expanded && 'rotate-180'
              )}
            />
          )}
        </button>
        {!collapsed && expanded && (
          <div className="ml-4 space-y-1 border-l border-ds-border pl-3">
            {item.children.map((child) => (
              <NavLink
                key={child.path}
                to={child.path}
                className={({ isActive }) =>
                  cn(
                    'flex items-center rounded-md px-3 py-2 text-sm transition-colors',
                    isActive
                      ? 'bg-ds-primary/20 text-ds-primary'
                      : 'text-ds-fg-muted hover:bg-ds-surface-2 hover:text-ds-fg'
                  )
                }
              >
                {child.label}
              </NavLink>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <NavLink
      to={item.path!}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors',
          isActive
            ? 'bg-ds-primary/20 text-ds-primary'
            : 'text-ds-fg-muted hover:bg-ds-surface-2 hover:text-ds-fg'
        )
      }
    >
      <item.icon className="h-5 w-5 shrink-0" />
      {!collapsed && <span>{item.label}</span>}
    </NavLink>
  );
}

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        'flex flex-col border-r border-ds-border bg-ds-surface transition-all duration-200',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      <div className="flex h-16 items-center justify-between border-b border-ds-border px-4">
        {!collapsed && (
          <span className="text-lg font-semibold text-ds-fg">K12教务</span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="rounded-md p-2 text-ds-fg-muted hover:bg-ds-surface-2 hover:text-ds-fg"
        >
          <ChevronLeft
            className={cn(
              'h-4 w-4 transition-transform',
              collapsed && 'rotate-180'
            )}
          />
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-2">
        {menuItems.map((item, index) => (
          <MenuItemComponent
            key={item.path || item.label}
            item={item}
            collapsed={collapsed}
          />
        ))}
      </nav>
    </aside>
  );
}
