import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy, Users, TrendingUp, Calendar, Filter, Download } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export default function MoralStats() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'ranking' | 'class' | 'trend'>('ranking');
  const [selectedGradeId, setSelectedGradeId] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');

  // 获取年级列表
  const { data: grades } = useQuery({
    queryKey: ['grades'],
    queryFn: async () => {
      const res = await api.get('/org/grades');
      return res.data;
    },
  });

  // 获取班级列表
  const { data: classes } = useQuery({
    queryKey: ['classes', selectedGradeId],
    queryFn: async () => {
      const res = await api.get('/org/classes', { params: { gradeId: selectedGradeId } });
      return res.data;
    },
    enabled: !!selectedGradeId,
  });

  // 获取学生统计
  const { data: studentStats } = useQuery({
    queryKey: ['moralStudentStats', selectedGradeId, selectedClassId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedGradeId) params.append('gradeId', selectedGradeId);
      if (selectedClassId) params.append('classId', selectedClassId);
      const res = await api.get(`/moral/stats/students?${params.toString()}`);
      return res.data;
    },
  });

  // 获取班级统计
  const { data: classStats } = useQuery({
    queryKey: ['moralClassStats', selectedGradeId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedGradeId) params.append('gradeId', selectedGradeId);
      const res = await api.get(`/moral/stats/classes?${params.toString()}`);
      return res.data;
    },
  });

  // 获取分类统计
  const { data: categoryStats } = useQuery({
    queryKey: ['moralCategoryStats', selectedGradeId, selectedClassId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedGradeId) params.append('gradeId', selectedGradeId);
      if (selectedClassId) params.append('classId', selectedClassId);
      const res = await api.get(`/moral/stats/categories?${params.toString()}`);
      return res.data;
    },
  });

  const sortedStudents = studentStats?.sort((a: any, b: any) => a.totalScore - b.totalScore) || [];
  const sortedClasses = classStats?.sort((a: any, b: any) => a.totalScore - b.totalScore) || [];

  return (
    <div className="min-h-screen bg-ds-bg">
      {/* Header */}
      <div className="surface-card border-b border-ds-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/moral')}
                className="flex items-center gap-2 text-ds-fg-muted hover:text-ds-fg"
              >
                <ArrowLeft className="h-5 w-5" />
                返回
              </button>
              <h1 className="text-xl font-bold text-ds-fg">德育统计报表</h1>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-ds-primary text-white rounded-lg hover:bg-ds-primary/90">
              <Download className="h-4 w-4" />
              导出报表
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* 筛选区域 */}
        <div className="surface-card border border-ds-border rounded-lg p-4 mb-6">
          <div className="flex items-center gap-4">
            <Filter className="h-4 w-4 text-ds-fg-muted" />
            <span className="text-sm font-medium text-ds-fg">筛选范围</span>
            <select
              value={selectedGradeId}
              onChange={(e) => {
                setSelectedGradeId(e.target.value);
                setSelectedClassId('');
              }}
              className="rounded-md border border-ds-border bg-ds-surface px-3 py-2 text-sm"
            >
              <option value="">全部年级</option>
              {grades?.map((g: any) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              disabled={!selectedGradeId}
              className="rounded-md border border-ds-border bg-ds-surface px-3 py-2 text-sm disabled:opacity-50"
            >
              <option value="">全部班级</option>
              {classes?.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-ds-border mb-6">
          {[
            { id: 'ranking', label: '学生排行榜', icon: Trophy },
            { id: 'class', label: '班级排行榜', icon: Users },
            { id: 'trend', label: '统计分析', icon: TrendingUp },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-b-2 border-ds-primary text-ds-primary'
                  : 'text-ds-fg-muted hover:text-ds-fg'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* 学生排行榜 */}
        {activeTab === 'ranking' && (
          <div className="surface-card border border-ds-border rounded-lg overflow-hidden">
            <div className="p-4 border-b border-ds-border">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Trophy className="h-5 w-5 text-ds-warning" />
                学生德育排行榜（需重点关注）
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-ds-surface">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium">排名</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">学生</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">班级</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">学期累计</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">事件数</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedStudents.map((student: any, index: number) => (
                    <tr key={student.studentId} className="border-t border-ds-border hover:bg-ds-surface-2/50">
                      <td className="px-4 py-3">
                        <span className={`inline-flex w-8 h-8 items-center justify-center rounded-full text-sm font-bold ${
                          index < 3 ? 'bg-ds-danger/20 text-ds-danger' : 'bg-ds-surface text-ds-fg-muted'
                        }`}>
                          {index + 1}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{student.studentName || student.name}</div>
                        <div className="text-sm text-ds-fg-muted">{student.studentNo}</div>
                      </td>
                      <td className="px-4 py-3 text-sm">{student.className}</td>
                      <td className="px-4 py-3">
                        <span className={`font-bold ${student.totalScore < 0 ? 'text-ds-danger' : 'text-ds-success'}`}>
                          {student.totalScore > 0 ? '+' : ''}{student.totalScore}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">{student.eventCount}次</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 班级排行榜 */}
        {activeTab === 'class' && (
          <div className="surface-card border border-ds-border rounded-lg overflow-hidden">
            <div className="p-4 border-b border-ds-border">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Users className="h-5 w-5 text-ds-primary" />
                班级德育排行榜
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-ds-surface">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium">排名</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">班级</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">学生数</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">总分</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">均分</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedClasses.map((cls: any, index: number) => (
                    <tr key={cls.classId} className="border-t border-ds-border hover:bg-ds-surface-2/50">
                      <td className="px-4 py-3">
                        <span className={`inline-flex w-8 h-8 items-center justify-center rounded-full text-sm font-bold ${
                          index < 3 ? 'bg-ds-danger/20 text-ds-danger' : 'bg-ds-surface text-ds-fg-muted'
                        }`}>
                          {index + 1}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium">{cls.className}</td>
                      <td className="px-4 py-3 text-sm">{cls.studentCount}人</td>
                      <td className="px-4 py-3">
                        <span className={`font-bold ${cls.totalScore < 0 ? 'text-ds-danger' : 'text-ds-success'}`}>
                          {cls.totalScore > 0 ? '+' : ''}{cls.totalScore}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">{cls.avgScore}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 统计分析 */}
        {activeTab === 'trend' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="surface-card border border-ds-border rounded-lg p-6">
              <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5 text-ds-primary" />
                分类统计
              </h2>
              <div className="space-y-4">
                {categoryStats?.map((item: any) => (
                  <div key={item.category} className="flex items-center justify-between">
                    <span className="text-ds-fg">{item.category}</span>
                    <span className="text-ds-fg-muted">{item.count}次</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="surface-card border border-ds-border rounded-lg p-6">
              <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
                <Calendar className="h-5 w-5 text-ds-primary" />
                趋势分析
              </h2>
              <div className="text-center py-12 text-ds-fg-muted">
                <TrendingUp className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>趋势图表开发中</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
