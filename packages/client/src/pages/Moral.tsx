import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Award, Plus, Search, Upload, AlertTriangle, TrendingDown, TrendingUp, Users, Building2, Calendar, Filter } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

// 批量导入组件
function ImportModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<any>(null);

  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return api.post('/moral/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: (res) => {
      setResult(res.data);
      queryClient.invalidateQueries({ queryKey: ['moralEvents'] });
      queryClient.invalidateQueries({ queryKey: ['moralStats'] });
    },
  });

  const handleDownloadTemplate = async () => {
    const res = await api.get('/moral/import/template', { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', '德育导入模板.xlsx');
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 dark:bg-gray-800">
        <h3 className="mb-4 text-lg font-semibold">批量导入德育记录</h3>
        
        <div className="mb-4">
          <button
            onClick={handleDownloadTemplate}
            className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400"
          >
            下载导入模板
          </button>
        </div>

        <div className="mb-4">
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full rounded border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700"
          />
        </div>

        {result && (
          <div className="mb-4 rounded bg-gray-100 p-3 dark:bg-gray-700">
            <p>成功: {result.success} 条</p>
            <p>失败: {result.failed} 条</p>
            {result.errors?.length > 0 && (
              <div className="mt-2 max-h-32 overflow-auto text-sm text-red-600">
                {result.errors.map((err: any, i: number) => (
                  <p key={i}>第{err.row}行: {err.message}</p>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded px-4 py-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            取消
          </button>
          <button
            onClick={() => file && importMutation.mutate(file)}
            disabled={!file || importMutation.isPending}
            className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {importMutation.isPending ? '导入中...' : '导入'}
          </button>
        </div>
      </div>
    </div>
  );
}

// 德育事件列表组件
function MoralEventsList({ gradeId, classId, onAddEvent }: { gradeId?: string; classId?: string; onAddEvent: () => void }) {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [showAllEvents, setShowAllEvents] = useState(false);
  
  const { data: events, isLoading } = useQuery({
    queryKey: ['moralEvents', gradeId, classId, startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('page', '1');
      params.append('pageSize', '200'); // 获取更多数据
      if (gradeId) params.append('gradeId', gradeId);
      if (classId) params.append('classId', classId);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      const res = await api.get(`/moral/events?${params.toString()}`);
      return res.data?.list || [];
    },
  });

  // 处理事件数据，提取学生信息
  const processedEvents = events?.map((event: any) => ({
    ...event,
    studentName: event.students?.users?.name || event.studentName || '未知',
    studentNo: event.students?.studentNo || event.studentNo || '',
    className: event.students?.classes?.name || event.className || '',
    gradeName: event.students?.grades?.name || event.gradeName || '',
  }));

  const filteredEvents = processedEvents?.filter((event: any) => {
    const matchKeyword = !searchKeyword || 
      event.studentName?.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      event.studentNo?.toLowerCase().includes(searchKeyword.toLowerCase());
    const matchCategory = !selectedCategory || event.category === selectedCategory;
    return matchKeyword && matchCategory;
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-ds-primary border-t-transparent rounded-full mx-auto" />
          <p className="mt-4 text-ds-fg-muted">加载中...</p>
        </div>
      </div>
    );
  }

  if (!events?.length) {
    return (
      <div className="text-center py-12 text-ds-fg-muted">
        <Award className="mx-auto h-12 w-12 mb-4 opacity-50" />
        <p>暂无德育事件记录</p>
        <button
          onClick={onAddEvent}
          className="mt-4 px-4 py-2 bg-ds-primary text-white rounded-lg hover:bg-ds-primary/90 text-sm"
        >
          + 录入德育事件
        </button>
      </div>
    );
  }

  const categoryLabels: Record<string, string> = {
    behavior: '行为规范',
    hygiene: '卫生纪律',
    study: '学习表现',
    activity: '活动参与',
    other: '其他',
  };

  return (
    <div className="space-y-4">
      {/* 搜索、分类和时间筛选 */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ds-fg-muted" />
          <input
            type="text"
            placeholder="搜索学生姓名或学号..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="w-full rounded-md border border-ds-border bg-ds-surface pl-10 pr-4 py-2 text-sm text-ds-fg placeholder:text-ds-fg-muted focus:border-ds-primary focus:outline-none"
          />
        </div>
        <select 
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="rounded-md border border-ds-border bg-ds-surface px-3 py-2 text-sm text-ds-fg"
        >
          <option value="">全部分类</option>
          <option value="behavior">行为规范</option>
          <option value="hygiene">卫生纪律</option>
          <option value="study">学习表现</option>
          <option value="activity">活动参与</option>
          <option value="other">其他</option>
        </select>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="rounded-md border border-ds-border bg-ds-surface px-3 py-2 text-sm text-ds-fg"
          placeholder="开始日期"
        />
        <span className="text-ds-fg-muted">至</span>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="rounded-md border border-ds-border bg-ds-surface px-3 py-2 text-sm text-ds-fg"
          placeholder="结束日期"
        />
      </div>

      {/* 事件列表 */}
      <div className="space-y-2 max-h-96 overflow-auto">
        {filteredEvents?.map((event: any) => (
          <div 
            key={event.id} 
            onClick={() => setSelectedEvent(event)}
            className="flex items-center justify-between p-3 bg-ds-surface rounded-lg border border-ds-border cursor-pointer hover:border-ds-primary/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                event.scoreDelta > 0 ? 'bg-ds-success/10 text-ds-success' : 'bg-ds-danger/10 text-ds-danger'
              }`}>
                {event.scoreDelta > 0 ? '+' : ''}{event.scoreDelta}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-ds-fg">{event.studentName}</span>
                  <span className="text-xs text-ds-fg-muted">{event.studentNo}</span>
                </div>
                <div className="text-xs text-ds-fg-muted">
                  {event.className} · {categoryLabels[event.category] || event.category} · {event.itemName}
                </div>
                {event.note && (
                  <div className="text-xs text-ds-fg-muted mt-1 truncate max-w-md">备注: {event.note}</div>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-ds-fg-muted">
                {new Date(event.occurredAt).toLocaleDateString('zh-CN')}
              </div>
              <div className="text-xs text-ds-primary mt-1">点击查看详情</div>
            </div>
          </div>
        ))}
      </div>

      {/* 查看全部事件按钮 */}
      {events?.length > 0 && (
        <div className="text-center pt-2">
          <button
            onClick={() => setShowAllEvents(true)}
            className="text-sm text-ds-primary hover:text-ds-primary/80 underline"
          >
            查看全部事件 ({filteredEvents?.length || 0}条)
          </button>
        </div>
      )}

      {filteredEvents?.length === 0 && events?.length > 0 && (
        <div className="text-center py-8 text-ds-fg-muted">
          <p>没有找到匹配的事件</p>
        </div>
      )}

      {/* 查看全部事件弹窗 */}
      {showAllEvents && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-6xl max-h-[90vh] bg-white dark:bg-gray-800 rounded-lg overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-ds-border">
              <div>
                <h3 className="text-lg font-semibold">全部德育事件</h3>
                <p className="text-sm text-ds-fg-muted">
                  共 {filteredEvents?.length || 0} 条事件
                  {startDate && endDate && ` (${startDate} 至 ${endDate})`}
                </p>
              </div>
              <button 
                onClick={() => setShowAllEvents(false)}
                className="text-ds-fg-muted hover:text-ds-fg"
              >
                <span className="text-2xl">&times;</span>
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <table className="w-full">
                <thead className="bg-ds-surface sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left text-sm font-medium">分值</th>
                    <th className="px-3 py-2 text-left text-sm font-medium">学生</th>
                    <th className="px-3 py-2 text-left text-sm font-medium">班级</th>
                    <th className="px-3 py-2 text-left text-sm font-medium">分类</th>
                    <th className="px-3 py-2 text-left text-sm font-medium">事项</th>
                    <th className="px-3 py-2 text-left text-sm font-medium">发生时间</th>
                    <th className="px-3 py-2 text-left text-sm font-medium">备注</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEvents?.map((event: any) => (
                    <tr key={event.id} className="border-t border-ds-border hover:bg-ds-surface-2/50">
                      <td className="px-3 py-2">
                        <span className={`font-bold ${event.scoreDelta > 0 ? 'text-ds-success' : 'text-ds-danger'}`}>
                          {event.scoreDelta > 0 ? '+' : ''}{event.scoreDelta}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="font-medium">{event.studentName}</div>
                        <div className="text-xs text-ds-fg-muted">{event.studentNo}</div>
                      </td>
                      <td className="px-3 py-2 text-sm">{event.className}</td>
                      <td className="px-3 py-2 text-sm">{categoryLabels[event.category] || event.category}</td>
                      <td className="px-3 py-2 text-sm">{event.itemName}</td>
                      <td className="px-3 py-2 text-sm">{new Date(event.occurredAt).toLocaleString('zh-CN')}</td>
                      <td className="px-3 py-2 text-sm max-w-xs truncate">{event.note || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 事件详情弹窗 */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-ds-border">
              <h3 className="text-lg font-semibold">德育事件详情</h3>
              <button 
                onClick={() => setSelectedEvent(null)}
                className="text-ds-fg-muted hover:text-ds-fg"
              >
                <span className="text-2xl">&times;</span>
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${
                  selectedEvent.scoreDelta > 0 ? 'bg-ds-success/10 text-ds-success' : 'bg-ds-danger/10 text-ds-danger'
                }`}>
                  {selectedEvent.scoreDelta > 0 ? '+' : ''}{selectedEvent.scoreDelta}
                </div>
                <div>
                  <div className="font-medium text-lg">{selectedEvent.studentName}</div>
                  <div className="text-sm text-ds-fg-muted">{selectedEvent.studentNo} · {selectedEvent.className}</div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-ds-fg-muted">分类:</span>
                  <span className="ml-2">{categoryLabels[selectedEvent.category] || selectedEvent.category}</span>
                </div>
                <div>
                  <span className="text-ds-fg-muted">事项:</span>
                  <span className="ml-2">{selectedEvent.itemName}</span>
                </div>
                <div>
                  <span className="text-ds-fg-muted">发生时间:</span>
                  <span className="ml-2">{new Date(selectedEvent.occurredAt).toLocaleString('zh-CN')}</span>
                </div>
                <div>
                  <span className="text-ds-fg-muted">录入时间:</span>
                  <span className="ml-2">{new Date(selectedEvent.createdAt).toLocaleString('zh-CN')}</span>
                </div>
              </div>

              {selectedEvent.note && (
                <div className="p-3 bg-ds-surface rounded-lg">
                  <div className="text-sm text-ds-fg-muted mb-1">备注</div>
                  <div className="text-sm">{selectedEvent.note}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 规则列表组件
function RulesList({ onAddRule }: { onAddRule: () => void }) {
  const { data: rules, isLoading } = useQuery({
    queryKey: ['moralRules'],
    queryFn: async () => {
      const res = await api.get('/moral/rules');
      return res.data?.list || [];
    },
  });

  const queryClient = useQueryClient();
  
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/moral/rules/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moralRules'] });
    },
  });

  const categoryLabels: Record<string, string> = {
    behavior: '行为规范',
    hygiene: '卫生纪律',
    study: '学习表现',
    activity: '活动参与',
    other: '其他',
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-ds-fg">德育规则</h3>
          <button 
            onClick={onAddRule}
            className="flex items-center gap-2 rounded-md bg-ds-primary px-3 py-1.5 text-sm text-white hover:bg-ds-primary/90"
          >
            <Plus className="h-4 w-4" />
            添加规则
          </button>
        </div>
        <div className="text-center py-12 text-ds-fg-muted">
          <div className="animate-spin w-8 h-8 border-2 border-ds-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p>加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-ds-fg">德育规则</h3>
        <button 
          onClick={onAddRule}
          className="flex items-center gap-2 rounded-md bg-ds-primary px-3 py-1.5 text-sm text-white hover:bg-ds-primary/90"
        >
          <Plus className="h-4 w-4" />
          添加规则
        </button>
      </div>

      {!rules?.length ? (
        <div className="text-center py-12 text-ds-fg-muted">
          <Award className="mx-auto h-12 w-12 mb-4 opacity-50" />
          <p>暂无德育规则</p>
          <p className="text-sm mt-2">点击右上角按钮添加规则</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rules.map((rule: any) => (
            <div key={rule.id} className="surface-card border border-ds-border rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-ds-fg">{rule.name}</h4>
                  <p className="text-sm text-ds-fg-muted mt-1">{categoryLabels[rule.category] || rule.category}</p>
                  {rule.description && (
                    <p className="text-xs text-ds-fg-muted mt-2 line-clamp-2">{rule.description}</p>
                  )}
                </div>
                <div className={`text-xl font-bold ${rule.score >= 0 ? 'text-ds-success' : 'text-ds-danger'}`}>
                  {rule.score >= 0 ? '+' : ''}{rule.score}
                </div>
              </div>
              <div className="flex justify-end mt-3 pt-3 border-t border-ds-border">
                <button
                  onClick={() => {
                    if (confirm(`确定要删除规则"${rule.name}"吗？`)) {
                      deleteMutation.mutate(rule.id);
                    }
                  }}
                  className="text-xs text-ds-danger hover:text-ds-danger/80"
                >
                  删除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// 添加规则弹窗
function RuleModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('behavior');
  const [scoreDelta, setScoreDelta] = useState(0);
  const [description, setDescription] = useState('');

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return api.post('/moral/rules', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moralRules'] });
      onClose();
    },
    onError: (error: any) => {
      console.error('创建规则失败:', error);
      alert('保存失败: ' + (error.response?.data?.message || error.message || '未知错误'));
    },
  });

  const handleSubmit = () => {
    if (!name) {
      alert('请输入规则名称');
      return;
    }
    createMutation.mutate({
      name,
      category,
      score: scoreDelta,  // 后端使用 score 字段
      description,
    });
  };

  const categories = [
    { value: 'behavior', label: '行为规范' },
    { value: 'hygiene', label: '卫生纪律' },
    { value: 'study', label: '学习表现' },
    { value: 'activity', label: '活动参与' },
    { value: 'other', label: '其他' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white dark:bg-gray-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">添加德育规则</h3>
          <button onClick={onClose} className="text-ds-fg-muted hover:text-ds-fg">
            <span className="text-2xl">&times;</span>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ds-fg mb-1">规则名称</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：迟到、早退、助人为乐..."
              className="w-full rounded-md border border-ds-border bg-ds-surface px-3 py-2 text-sm text-ds-fg focus:border-ds-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ds-fg mb-1">分类</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-md border border-ds-border bg-ds-surface px-3 py-2 text-sm text-ds-fg focus:border-ds-primary focus:outline-none"
            >
              {categories.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-ds-fg mb-1">分值</label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={scoreDelta}
                onChange={(e) => setScoreDelta(Number(e.target.value))}
                className="w-24 rounded-md border border-ds-border bg-ds-surface px-3 py-2 text-sm text-ds-fg focus:border-ds-primary focus:outline-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setScoreDelta(-1)}
                  className={`px-3 py-2 rounded-md text-sm ${scoreDelta === -1 ? 'bg-ds-danger text-white' : 'bg-ds-surface text-ds-fg border border-ds-border'}`}
                >
                  -1
                </button>
                <button
                  onClick={() => setScoreDelta(-2)}
                  className={`px-3 py-2 rounded-md text-sm ${scoreDelta === -2 ? 'bg-ds-danger text-white' : 'bg-ds-surface text-ds-fg border border-ds-border'}`}
                >
                  -2
                </button>
                <button
                  onClick={() => setScoreDelta(-5)}
                  className={`px-3 py-2 rounded-md text-sm ${scoreDelta === -5 ? 'bg-ds-danger text-white' : 'bg-ds-surface text-ds-fg border border-ds-border'}`}
                >
                  -5
                </button>
                <button
                  onClick={() => setScoreDelta(1)}
                  className={`px-3 py-2 rounded-md text-sm ${scoreDelta === 1 ? 'bg-ds-success text-white' : 'bg-ds-surface text-ds-fg border border-ds-border'}`}
                >
                  +1
                </button>
                <button
                  onClick={() => setScoreDelta(2)}
                  className={`px-3 py-2 rounded-md text-sm ${scoreDelta === 2 ? 'bg-ds-success text-white' : 'bg-ds-surface text-ds-fg border border-ds-border'}`}
                >
                  +2
                </button>
              </div>
            </div>
            <p className="text-xs text-ds-fg-muted mt-1">
              负数为扣分，正数为加分
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-ds-fg mb-1">描述（可选）</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="请输入规则详细描述..."
              rows={3}
              className="w-full rounded-md border border-ds-border bg-ds-surface px-3 py-2 text-sm text-ds-fg placeholder:text-ds-fg-muted focus:border-ds-primary focus:outline-none resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-md border border-ds-border text-ds-fg hover:bg-ds-surface"
            >
              取消
            </button>
            <button
              onClick={handleSubmit}
              disabled={createMutation.isPending || !name}
              className="px-4 py-2 rounded-md bg-ds-primary text-white hover:bg-ds-primary/90 disabled:opacity-50"
            >
              {createMutation.isPending ? '保存中...' : '保存'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// 预警学生列表组件（滚动展示 + 查看完整）
function AlertStudentsList({ gradeId, classId }: { gradeId?: string; classId?: string }) {
  const [showFullList, setShowFullList] = useState(false);
  const { data: studentStats } = useQuery({
    queryKey: ['moralAlertStudents', gradeId, classId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (gradeId) params.append('gradeId', gradeId);
      if (classId) params.append('classId', classId);
      const res = await api.get(`/moral/stats/students?${params.toString()}`);
      return res.data;
    },
  });

  // 筛选出需要预警的学生（扣分过多：总分 < 0 或 7天内扣分次数过多）
  const alertStudents = studentStats?.filter((s: any) => 
    s.totalScore < 0 || (s.subCount > 0 && s.recentCount >= 3)
  ) || [];

  if (!alertStudents?.length) {
    return (
      <div className="text-center py-8 text-ds-fg-muted">
        <AlertTriangle className="mx-auto h-12 w-12 mb-4 opacity-50" />
        <p>暂无预警学生</p>
        <p className="text-sm mt-1">所有学生德育表现良好</p>
      </div>
    );
  }

  // 只显示前3条，其余滚动
  const displayStudents = alertStudents.slice(0, 3);

  return (
    <>
      {/* 滚动展示区域 */}
      <div className="space-y-2 max-h-48 overflow-hidden relative">
        {displayStudents.map((student: any, index: number) => (
          <div 
            key={student.studentId}
            className="flex items-center justify-between p-3 bg-ds-surface rounded-lg border border-ds-border animate-fade-in"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-ds-danger/10 flex items-center justify-center text-ds-danger font-bold text-sm">
                {index + 1}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-ds-fg">{student.studentName || student.name}</span>
                  <span className="text-xs text-ds-fg-muted">{student.studentNo}</span>
                </div>
                <div className="text-xs text-ds-fg-muted">{student.className}</div>
              </div>
            </div>
            <div className="text-right">
              <div className={`font-bold ${student.totalScore < 0 ? 'text-ds-danger' : 'text-ds-success'}`}>
                {student.totalScore > 0 ? '+' : ''}{student.totalScore}
              </div>
              <div className="text-xs text-ds-fg-muted">{student.recentCount}次/7天</div>
            </div>
          </div>
        ))}
        
        {/* 查看更多提示 */}
        {alertStudents.length > 3 && (
          <div className="text-center py-2 text-xs text-ds-fg-muted">
            还有 {alertStudents.length - 3} 名学生...
          </div>
        )}
      </div>

      {/* 查看完整名单按钮 */}
      <div className="mt-4 text-center">
        <button
          onClick={() => setShowFullList(true)}
          className="text-sm text-ds-primary hover:text-ds-primary/80 underline"
        >
          查看完整预警名单 ({alertStudents.length}人)
        </button>
      </div>

      {/* 完整名单弹窗 */}
      {showFullList && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-4xl max-h-[80vh] bg-white dark:bg-gray-800 rounded-lg overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-ds-border">
              <h3 className="text-lg font-semibold">完整预警名单 ({alertStudents.length}人)</h3>
              <button 
                onClick={() => setShowFullList(false)}
                className="text-ds-fg-muted hover:text-ds-fg"
              >
                <span className="text-2xl">&times;</span>
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <table className="w-full">
                <thead className="bg-ds-surface sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium">学生</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">班级</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">学期累计</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">7天频次</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">预警类型</th>
                  </tr>
                </thead>
                <tbody>
                  {alertStudents.map((student: any) => (
                    <tr key={student.studentId} className="border-t border-ds-border">
                      <td className="px-4 py-3">
                        <div className="font-medium">{student.studentName || student.name}</div>
                        <div className="text-sm text-ds-fg-muted">{student.studentNo}</div>
                      </td>
                      <td className="px-4 py-3 text-sm">{student.className}</td>
                      <td className="px-4 py-3">
                        <span className={student.totalScore < 0 ? 'text-ds-danger' : 'text-ds-success'}>
                          {student.totalScore > 0 ? '+' : ''}{student.totalScore}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">{student.recentCount}次</td>
                      <td className="px-4 py-3">
                        {student.alerts?.map((alert: string) => (
                          <span key={alert} className={`inline-block px-2 py-0.5 rounded text-xs mr-1 ${
                            alert === '累计预警' ? 'bg-ds-danger/20 text-ds-danger' : 'bg-ds-warning/20 text-ds-warning'
                          }`}>
                            {alert}
                          </span>
                        ))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// 班级排行榜组件
function ClassRanking({ gradeId }: { gradeId?: string }) {
  const { data: classStats } = useQuery({
    queryKey: ['moralClassStats', gradeId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (gradeId) params.append('gradeId', gradeId);
      const res = await api.get(`/moral/stats/classes?${params.toString()}`);
      return res.data;
    },
  });

  const sortedClasses = classStats?.sort((a: any, b: any) => a.totalScore - b.totalScore) || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-ds-fg">班级德育排行榜</h3>
        <span className="text-sm text-ds-fg-muted">按总分从低到高排序</span>
      </div>
      
      {!sortedClasses.length ? (
        <div className="text-center py-8 text-ds-fg-muted">
          <Building2 className="mx-auto h-12 w-12 mb-4 opacity-50" />
          <p>暂无班级数据</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {sortedClasses.map((cls: any, index: number) => (
            <div key={cls.classId} className="flex items-center gap-4 p-3 surface-card border border-ds-border rounded-lg">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                index < 3 ? 'bg-ds-danger/20 text-ds-danger' : 'bg-ds-surface text-ds-fg-muted'
              }`}>
                {index + 1}
              </div>
              <div className="flex-1">
                <div className="font-medium text-ds-fg">{cls.className}</div>
                <div className="text-sm text-ds-fg-muted">{cls.studentCount}人</div>
              </div>
              <div className="text-right">
                <div className={`text-xl font-bold ${cls.totalScore < 0 ? 'text-ds-danger' : 'text-ds-success'}`}>
                  {cls.totalScore > 0 ? '+' : ''}{cls.totalScore}
                </div>
                <div className="text-xs text-ds-fg-muted">均分 {cls.avgScore}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// 学生排行榜组件
function StudentRanking({ gradeId, classId }: { gradeId?: string; classId?: string }) {
  const { data: studentStats } = useQuery({
    queryKey: ['moralStudentStats', gradeId, classId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (gradeId) params.append('gradeId', gradeId);
      if (classId) params.append('classId', classId);
      const res = await api.get(`/moral/stats/students?${params.toString()}`);
      return res.data;
    },
  });

  const sortedStudents = studentStats?.sort((a: any, b: any) => a.totalScore - b.totalScore).slice(0, 20) || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-ds-fg">学生德育排行榜（后20名）</h3>
        <span className="text-sm text-ds-fg-muted">需重点关注</span>
      </div>
      
      {!sortedStudents.length ? (
        <div className="text-center py-8 text-ds-fg-muted">
          <Users className="mx-auto h-12 w-12 mb-4 opacity-50" />
          <p>暂无学生数据</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-ds-surface">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-ds-fg">排名</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-ds-fg">学生</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-ds-fg">班级</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-ds-fg">总分</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-ds-fg">事件数</th>
              </tr>
            </thead>
            <tbody>
              {sortedStudents.map((student: any, index: number) => (
                <tr key={student.studentId} className="border-t border-ds-border hover:bg-ds-surface-2/50">
                  <td className="px-4 py-3">
                    <span className={`inline-flex w-6 h-6 items-center justify-center rounded-full text-xs font-bold ${
                      index < 3 ? 'bg-ds-danger/20 text-ds-danger' : 'bg-ds-surface text-ds-fg-muted'
                    }`}>
                      {index + 1}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-ds-fg">{student.studentName || student.name}</div>
                    <div className="text-sm text-ds-fg-muted">{student.studentNo}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-ds-fg-muted">{student.className}</td>
                  <td className="px-4 py-3">
                    <span className={`font-bold ${student.totalScore < 0 ? 'text-ds-danger' : 'text-ds-success'}`}>
                      {student.totalScore > 0 ? '+' : ''}{student.totalScore}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-ds-fg">{student.eventCount}次</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// 来源统计组件
function SourceStats({ gradeId, classId }: { gradeId?: string; classId?: string }) {
  const { data: categoryStats } = useQuery({
    queryKey: ['moralCategoryStats', gradeId, classId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (gradeId) params.append('gradeId', gradeId);
      if (classId) params.append('classId', classId);
      const res = await api.get(`/moral/stats/categories?${params.toString()}`);
      return res.data;
    },
  });

  const total = categoryStats?.reduce((sum: number, item: any) => sum + item.count, 0) || 0;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-ds-fg">德育事件来源分布</h3>
      
      {!categoryStats?.length ? (
        <div className="text-center py-8 text-ds-fg-muted">
          <Calendar className="mx-auto h-12 w-12 mb-4 opacity-50" />
          <p>暂无统计数据</p>
        </div>
      ) : (
        <div className="space-y-3">
          {categoryStats.map((item: any) => {
            const percentage = total > 0 ? (item.count / total * 100).toFixed(1) : 0;
            return (
              <div key={item.category} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-ds-fg">{item.category}</span>
                  <span className="text-ds-fg-muted">{item.count}次 ({percentage}%)</span>
                </div>
                <div className="h-2 bg-ds-surface rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-ds-primary rounded-full transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function Moral() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('events');
  const [showImportModal, setShowImportModal] = useState(false);
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [selectedGradeId, setSelectedGradeId] = useState<string>('');
  const [selectedClassId, setSelectedClassId] = useState<string>('');

  // 获取年级列表
  const { data: grades } = useQuery({
    queryKey: ['grades'],
    queryFn: async () => {
      const res = await api.get('/grades');
      return res.data;
    },
  });

  // 获取班级列表
  const { data: classes } = useQuery({
    queryKey: ['classes', selectedGradeId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedGradeId) params.append('gradeId', selectedGradeId);
      const res = await api.get(`/classes?${params.toString()}`);
      return res.data;
    },
    enabled: !!selectedGradeId,
  });

  // 获取统计数据（带筛选）
  const { data: stats } = useQuery({
    queryKey: ['moralStats', selectedGradeId, selectedClassId],
    queryFn: async () => {
      try {
        const params = new URLSearchParams();
        if (selectedGradeId) params.append('gradeId', selectedGradeId);
        if (selectedClassId) params.append('classId', selectedClassId);
        const res = await api.get(`/moral/stats/overview?${params.toString()}`);
        return res.data;
      } catch {
        return null;
      }
    },
  });

  // 获取预警学生数量（带筛选）
  const { data: alertCount } = useQuery({
    queryKey: ['moralAlertCount', selectedGradeId, selectedClassId],
    queryFn: async () => {
      try {
        const params = new URLSearchParams();
        params.append('alert', 'true');
        if (selectedGradeId) params.append('gradeId', selectedGradeId);
        if (selectedClassId) params.append('classId', selectedClassId);
        const res = await api.get(`/moral/stats/students?${params.toString()}`);
        return res.data?.length || 0;
      } catch {
        return 0;
      }
    },
  });

  // 当年级变化时，重置班级选择
  const handleGradeChange = (gradeId: string) => {
    setSelectedGradeId(gradeId);
    setSelectedClassId('');
  };

  // 获取当前筛选范围的显示文本
  const getFilterText = () => {
    if (selectedClassId) {
      const cls = classes?.find((c: any) => c.id === selectedClassId);
      return cls?.name || '当前班级';
    }
    if (selectedGradeId) {
      const grade = grades?.find((g: any) => g.id === selectedGradeId);
      return grade?.name || '当前年级';
    }
    return '全校';
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ds-fg">德育量化</h1>
          <p className="text-sm text-ds-fg-muted mt-1">学生德育行为记录与评价</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 rounded-md border border-ds-border px-4 py-2 text-sm text-ds-fg hover:bg-ds-surface"
          >
            <Upload className="h-4 w-4" />
            批量导入
          </button>
          <button
            onClick={() => navigate('/moral/entry')}
            className="flex items-center gap-2 rounded-md bg-ds-primary px-4 py-2 text-sm text-white hover:bg-ds-primary/90"
          >
            <Plus className="h-4 w-4" />
            记录德育事件
          </button>
        </div>
      </div>

      {/* 筛选区域 */}
      <div className="surface-card border border-ds-border rounded-lg p-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-ds-fg">
            <Filter className="h-4 w-4" />
            <span className="text-sm font-medium">筛选范围</span>
          </div>
          <div className="flex gap-3">
            <select
              value={selectedGradeId}
              onChange={(e) => handleGradeChange(e.target.value)}
              className="rounded-md border border-ds-border bg-ds-surface px-3 py-2 text-sm text-ds-fg focus:border-ds-primary focus:outline-none"
            >
              <option value="">全部年级</option>
              {grades?.map((grade: any) => (
                <option key={grade.id} value={grade.id}>{grade.name}</option>
              ))}
            </select>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              disabled={!selectedGradeId}
              className="rounded-md border border-ds-border bg-ds-surface px-3 py-2 text-sm text-ds-fg focus:border-ds-primary focus:outline-none disabled:opacity-50"
            >
              <option value="">全部班级</option>
              {classes?.map((cls: any) => (
                <option key={cls.id} value={cls.id}>{cls.name}</option>
              ))}
            </select>
            {(selectedGradeId || selectedClassId) && (
              <button
                onClick={() => {
                  setSelectedGradeId('');
                  setSelectedClassId('');
                }}
                className="text-sm text-ds-fg-muted hover:text-ds-fg"
              >
                重置
              </button>
            )}
          </div>
          <div className="ml-auto text-sm text-ds-fg-muted">
            当前查看：<span className="font-medium text-ds-fg">{getFilterText()}</span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="surface-card rounded-lg border border-ds-border p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-ds-success/10 p-2">
              <Award className="h-5 w-5 text-ds-success" />
            </div>
            <div>
              <p className="text-sm text-ds-fg-muted">本周加分</p>
              <p className="text-2xl font-bold text-ds-fg">{stats?.weeklyPositive || 0}</p>
            </div>
          </div>
        </div>
        <div className="surface-card rounded-lg border border-ds-border p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-ds-warning/10 p-2">
              <Award className="h-5 w-5 text-ds-warning" />
            </div>
            <div>
              <p className="text-sm text-ds-fg-muted">本周扣分</p>
              <p className="text-2xl font-bold text-ds-fg">{stats?.weeklyNegative || 0}</p>
            </div>
          </div>
        </div>
        <div className="surface-card rounded-lg border border-ds-border p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-ds-primary/10 p-2">
              <Award className="h-5 w-5 text-ds-primary" />
            </div>
            <div>
              <p className="text-sm text-ds-fg-muted">德育规则</p>
              <p className="text-2xl font-bold text-ds-fg">{stats?.rulesCount || 0}</p>
            </div>
          </div>
        </div>
        <div className="surface-card rounded-lg border border-ds-border p-4 relative">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-ds-danger/10 p-2">
              <AlertTriangle className="h-5 w-5 text-ds-danger" />
            </div>
            <div>
              <p className="text-sm text-ds-fg-muted">预警学生</p>
              <p className="text-2xl font-bold text-ds-fg">{alertCount || 0}</p>
            </div>
          </div>
          {alertCount > 0 && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-ds-danger rounded-full animate-pulse" />
          )}
        </div>
      </div>

      {/* Alert Section */}
      {alertCount > 0 && (
        <div className="surface-card rounded-lg border border-ds-danger/30 bg-ds-danger/5 p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-5 w-5 text-ds-danger" />
            <h3 className="font-semibold text-ds-danger">德育预警</h3>
            <span className="text-sm text-ds-fg-muted">（{getFilterText()} - 学期累计扣分过多或近期频次异常）</span>
          </div>
          <AlertStudentsList gradeId={selectedGradeId} classId={selectedClassId} />
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-ds-border">
        {[
          { id: 'events', label: '德育事件' },
          { id: 'ranking', label: '排行榜' },
          { id: 'stats', label: '统计分析' },
          { id: 'rules', label: '德育规则' },
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
          <MoralEventsList 
            gradeId={selectedGradeId} 
            classId={selectedClassId}
            onAddEvent={() => navigate('/moral/entry')}
          />
        )}

        {activeTab === 'ranking' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button
                onClick={() => navigate('/moral/stats')}
                className="flex items-center gap-2 px-4 py-2 bg-ds-primary text-white rounded-lg hover:bg-ds-primary/90 text-sm"
              >
                <TrendingUp className="h-4 w-4" />
                查看完整报表
              </button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ClassRanking gradeId={selectedGradeId} />
              <StudentRanking gradeId={selectedGradeId} classId={selectedClassId} />
            </div>
          </div>
        )}
        
        {activeTab === 'stats' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button
                onClick={() => navigate('/moral/stats')}
                className="flex items-center gap-2 px-4 py-2 bg-ds-primary text-white rounded-lg hover:bg-ds-primary/90 text-sm"
              >
                <TrendingUp className="h-4 w-4" />
                查看完整报表
              </button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SourceStats gradeId={selectedGradeId} classId={selectedClassId} />
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-ds-fg">德育趋势</h3>
                <div className="text-center py-8 text-ds-fg-muted">
                  <TrendingDown className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>趋势图表开发中</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'rules' && (
          <RulesList onAddRule={() => setShowRuleModal(true)} />
        )}
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <ImportModal onClose={() => setShowImportModal(false)} />
      )}

      {/* Rule Modal */}
      {showRuleModal && (
        <RuleModal onClose={() => setShowRuleModal(false)} />
      )}
    </div>
  );
}
