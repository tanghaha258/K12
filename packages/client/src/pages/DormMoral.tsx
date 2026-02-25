import { useState } from 'react';
import { Award, Plus, Search, Building2, Home, Users, BedDouble } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export default function DormMoral() {
  const [activeTab, setActiveTab] = useState('events');
  
  const { data: stats } = useQuery({
    queryKey: ['dormMoralStats'],
    queryFn: async () => {
      try {
        const res = await api.get('/moral/dorm/stats');
        return res.data;
      } catch {
        return null;
      }
    },
  });

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ds-fg">宿舍德育</h1>
          <p className="text-sm text-ds-fg-muted mt-1">宿舍行为记录与评价</p>
        </div>
        <button
          onClick={() => setActiveTab('add')}
          className="flex items-center gap-2 rounded-md bg-ds-primary px-4 py-2 text-sm text-white hover:bg-ds-primary/90"
        >
          <Plus className="h-4 w-4" />
          记录宿舍事件
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="surface-card rounded-lg border border-ds-border p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-ds-success/10 p-2">
              <Building2 className="h-5 w-5 text-ds-success" />
            </div>
            <div>
              <p className="text-sm text-ds-fg-muted">宿舍楼栋</p>
              <p className="text-2xl font-bold text-ds-fg">{stats?.buildingCount || 0}</p>
            </div>
          </div>
        </div>
        <div className="surface-card rounded-lg border border-ds-border p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-ds-primary/10 p-2">
              <Home className="h-5 w-5 text-ds-primary" />
            </div>
            <div>
              <p className="text-sm text-ds-fg-muted">宿舍房间</p>
              <p className="text-2xl font-bold text-ds-fg">{stats?.roomCount || 0}</p>
            </div>
          </div>
        </div>
        <div className="surface-card rounded-lg border border-ds-border p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-ds-info/10 p-2">
              <BedDouble className="h-5 w-5 text-ds-info" />
            </div>
            <div>
              <p className="text-sm text-ds-fg-muted">总床位数</p>
              <p className="text-2xl font-bold text-ds-fg">{stats?.bedCount || 0}</p>
            </div>
          </div>
        </div>
        <div className="surface-card rounded-lg border border-ds-border p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-ds-warning/10 p-2">
              <Award className="h-5 w-5 text-ds-warning" />
            </div>
            <div>
              <p className="text-sm text-ds-fg-muted">本周事件</p>
              <p className="text-2xl font-bold text-ds-fg">{stats?.weeklyEvents || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-ds-border">
        {[
          { id: 'events', label: '宿舍事件' },
          { id: 'buildings', label: '楼栋管理' },
          { id: 'stats', label: '统计分析' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'border-b-2 border-ds-primary text-ds-primary'
                : 'text-ds-fg-muted hover:text-ds-fg'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="surface-card rounded-lg border border-ds-border p-6">
        {activeTab === 'events' && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ds-fg-muted" />
                <input
                  type="text"
                  placeholder="搜索学生姓名或学号..."
                  className="w-full rounded-md border border-ds-border bg-ds-surface pl-10 pr-4 py-2 text-sm text-ds-fg placeholder:text-ds-fg-muted focus:border-ds-primary focus:outline-none"
                />
              </div>
              <select className="rounded-md border border-ds-border bg-ds-surface px-3 py-2 text-sm text-ds-fg">
                <option value="">全部楼栋</option>
                <option value="building1">1号楼</option>
                <option value="building2">2号楼</option>
              </select>
            </div>
            <div className="text-center py-12 text-ds-fg-muted">
              <Award className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>暂无宿舍德育事件记录</p>
              <p className="text-sm mt-1">点击右上角按钮添加记录</p>
            </div>
          </div>
        )}
        
        {activeTab === 'buildings' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-ds-fg">楼栋管理</h3>
              <button className="flex items-center gap-2 rounded-md bg-ds-primary px-3 py-1.5 text-sm text-white hover:bg-ds-primary/90">
                <Plus className="h-4 w-4" />
                添加楼栋
              </button>
            </div>
            <div className="text-center py-12 text-ds-fg-muted">
              <Building2 className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>暂无宿舍楼栋</p>
            </div>
          </div>
        )}
        
        {activeTab === 'stats' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-ds-fg">宿舍统计</h3>
            <div className="text-center py-12 text-ds-fg-muted">
              <Users className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>统计功能开发中</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
