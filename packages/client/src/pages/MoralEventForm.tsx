import { useState, useMemo } from 'react';
import { X, Search, Users, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

interface Student {
  id: string;
  studentNo: string;
  name: string;
  seatNo?: string;
  className?: string;
  classId?: string;
}

interface MoralRule {
  id: string;
  name: string;
  category: string;
  scoreDelta: number;
}

interface MoralEventFormProps {
  onClose: () => void;
  initialClassId?: string;
  initialGradeId?: string;
}

export default function MoralEventForm({ onClose, initialClassId, initialGradeId }: MoralEventFormProps) {
  const queryClient = useQueryClient();
  
  // 表单状态
  const [selectedGradeId, setSelectedGradeId] = useState(initialGradeId || '');
  const [selectedClassId, setSelectedClassId] = useState(initialClassId || '');
  const [selectedStudents, setSelectedStudents] = useState<Student[]>([]);
  const [selectedRuleId, setSelectedRuleId] = useState('');
  const [occurredAt, setOccurredAt] = useState(new Date().toISOString().slice(0, 16));
  const [description, setDescription] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [showStudentSelector, setShowStudentSelector] = useState(false);

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

  // 获取学生列表
  const { data: students } = useQuery({
    queryKey: ['students', selectedClassId],
    queryFn: async () => {
      if (!selectedClassId) return [];
      const res = await api.get(`/students?classId=${selectedClassId}`);
      return res.data;
    },
    enabled: !!selectedClassId,
  });

  // 获取德育规则列表
  const { data: rules } = useQuery({
    queryKey: ['moralRules'],
    queryFn: async () => {
      const res = await api.get('/moral/rules');
      return res.data?.list || [];
    },
  });

  // 创建德育事件
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return api.post('/moral/events/batch', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moralEvents'] });
      queryClient.invalidateQueries({ queryKey: ['moralStats'] });
      onClose();
    },
  });

  // 过滤学生
  const filteredStudents = useMemo(() => {
    if (!students) return [];
    if (!searchKeyword) return students;
    
    const keyword = searchKeyword.toLowerCase();
    return students.filter((s: Student) => 
      s.name.toLowerCase().includes(keyword) ||
      s.studentNo.toLowerCase().includes(keyword) ||
      (s.seatNo && s.seatNo.includes(keyword))
    );
  }, [students, searchKeyword]);

  // 选择/取消选择学生
  const toggleStudent = (student: Student) => {
    setSelectedStudents(prev => {
      const exists = prev.find(s => s.id === student.id);
      if (exists) {
        return prev.filter(s => s.id !== student.id);
      }
      return [...prev, student];
    });
  };

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (selectedStudents.length === filteredStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents([...filteredStudents]);
    }
  };

  // 获取选中的规则
  const selectedRule = rules?.find((r: MoralRule) => r.id === selectedRuleId);

  // 提交表单
  const handleSubmit = () => {
    if (selectedStudents.length === 0) {
      alert('请至少选择一名学生');
      return;
    }
    if (!selectedRuleId) {
      alert('请选择德育规则');
      return;
    }

    const events = selectedStudents.map(student => ({
      studentId: student.id,
      ruleId: selectedRuleId,
      occurredAt: new Date(occurredAt).toISOString(),
      description,
      source: 'TEACHER',
    }));

    createMutation.mutate({ events });
  };

  // 年级变化时重置班级
  const handleGradeChange = (gradeId: string) => {
    setSelectedGradeId(gradeId);
    setSelectedClassId('');
    setSelectedStudents([]);
  };

  // 班级变化时重置学生选择
  const handleClassChange = (classId: string) => {
    setSelectedClassId(classId);
    setSelectedStudents([]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-auto rounded-lg bg-white dark:bg-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-ds-border p-4">
          <h2 className="text-lg font-semibold text-ds-fg">录入德育事件</h2>
          <button onClick={onClose} className="text-ds-fg-muted hover:text-ds-fg">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* 筛选区域 */}
          <div className="flex gap-3">
            <select
              value={selectedGradeId}
              onChange={(e) => handleGradeChange(e.target.value)}
              className="rounded-md border border-ds-border bg-ds-surface px-3 py-2 text-sm text-ds-fg focus:border-ds-primary focus:outline-none"
            >
              <option value="">选择年级</option>
              {grades?.map((grade: any) => (
                <option key={grade.id} value={grade.id}>{grade.name}</option>
              ))}
            </select>
            <select
              value={selectedClassId}
              onChange={(e) => handleClassChange(e.target.value)}
              disabled={!selectedGradeId}
              className="rounded-md border border-ds-border bg-ds-surface px-3 py-2 text-sm text-ds-fg focus:border-ds-primary focus:outline-none disabled:opacity-50"
            >
              <option value="">选择班级</option>
              {classes?.map((cls: any) => (
                <option key={cls.id} value={cls.id}>{cls.name}</option>
              ))}
            </select>
          </div>

          {/* 学生选择区域 */}
          {selectedClassId && (
            <div className="border border-ds-border rounded-lg overflow-hidden">
              {/* 学生选择器头部 */}
              <div 
                className="flex items-center justify-between p-3 bg-ds-surface cursor-pointer"
                onClick={() => setShowStudentSelector(!showStudentSelector)}
              >
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-ds-primary" />
                  <span className="font-medium text-ds-fg">
                    选择学生 ({selectedStudents.length}人已选)
                  </span>
                </div>
                {showStudentSelector ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>

              {/* 学生选择器内容 */}
              {showStudentSelector && (
                <div className="p-3 space-y-3">
                  {/* 搜索和全选 */}
                  <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ds-fg-muted" />
                      <input
                        type="text"
                        placeholder="搜索姓名、学号、座位号..."
                        value={searchKeyword}
                        onChange={(e) => setSearchKeyword(e.target.value)}
                        className="w-full rounded-md border border-ds-border bg-ds-surface pl-10 pr-4 py-2 text-sm text-ds-fg placeholder:text-ds-fg-muted focus:border-ds-primary focus:outline-none"
                      />
                    </div>
                    <button
                      onClick={toggleSelectAll}
                      className="text-sm text-ds-primary hover:text-ds-primary/80"
                    >
                      {selectedStudents.length === filteredStudents.length ? '取消全选' : '全选'}
                    </button>
                  </div>

                  {/* 学生列表 */}
                  <div className="max-h-60 overflow-auto border border-ds-border rounded-md">
                    <table className="w-full">
                      <thead className="bg-ds-surface sticky top-0">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-ds-fg">选择</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-ds-fg">学号</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-ds-fg">姓名</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-ds-fg">座位号</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredStudents.map((student: Student) => {
                          const isSelected = selectedStudents.some(s => s.id === student.id);
                          return (
                            <tr 
                              key={student.id} 
                              className={`border-t border-ds-border cursor-pointer hover:bg-ds-surface-2/50 ${
                                isSelected ? 'bg-ds-primary/5' : ''
                              }`}
                              onClick={() => toggleStudent(student)}
                            >
                              <td className="px-3 py-2">
                                <div className={`w-5 h-5 rounded border flex items-center justify-center ${
                                  isSelected ? 'bg-ds-primary border-ds-primary' : 'border-ds-border'
                                }`}>
                                  {isSelected && <Check className="h-3 w-3 text-white" />}
                                </div>
                              </td>
                              <td className="px-3 py-2 text-sm text-ds-fg-muted">{student.studentNo}</td>
                              <td className="px-3 py-2 text-sm font-medium text-ds-fg">{student.name}</td>
                              <td className="px-3 py-2 text-sm text-ds-fg-muted">{student.seatNo || '-'}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 已选学生标签 */}
              {selectedStudents.length > 0 && (
                <div className="px-3 py-2 border-t border-ds-border bg-ds-surface/50">
                  <div className="flex flex-wrap gap-2">
                    {selectedStudents.map(student => (
                      <span 
                        key={student.id}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-ds-primary/10 text-ds-primary text-xs"
                      >
                        {student.name}
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleStudent(student);
                          }}
                          className="hover:text-ds-danger"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 德育规则选择 */}
          <div>
            <label className="block text-sm font-medium text-ds-fg mb-1">德育规则</label>
            <select
              value={selectedRuleId}
              onChange={(e) => setSelectedRuleId(e.target.value)}
              className="w-full rounded-md border border-ds-border bg-ds-surface px-3 py-2 text-sm text-ds-fg focus:border-ds-primary focus:outline-none"
            >
              <option value="">选择规则</option>
              {rules?.map((rule: MoralRule) => (
                <option key={rule.id} value={rule.id}>
                  {rule.name} ({rule.scoreDelta > 0 ? '+' : ''}{rule.scoreDelta}分)
                </option>
              ))}
            </select>
            {selectedRule && (
              <div className="mt-2 text-sm">
                <span className="text-ds-fg-muted">分值：</span>
                <span className={selectedRule.scoreDelta >= 0 ? 'text-ds-success' : 'text-ds-danger'}>
                  {selectedRule.scoreDelta > 0 ? '+' : ''}{selectedRule.scoreDelta}分
                </span>
                <span className="text-ds-fg-muted ml-4">分类：</span>
                <span className="text-ds-fg">{selectedRule.category}</span>
              </div>
            )}
          </div>

          {/* 发生时间 */}
          <div>
            <label className="block text-sm font-medium text-ds-fg mb-1">发生时间</label>
            <input
              type="datetime-local"
              value={occurredAt}
              onChange={(e) => setOccurredAt(e.target.value)}
              className="w-full rounded-md border border-ds-border bg-ds-surface px-3 py-2 text-sm text-ds-fg focus:border-ds-primary focus:outline-none"
            />
          </div>

          {/* 描述 */}
          <div>
            <label className="block text-sm font-medium text-ds-fg mb-1">描述（可选）</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="请输入事件详细描述..."
              rows={3}
              className="w-full rounded-md border border-ds-border bg-ds-surface px-3 py-2 text-sm text-ds-fg placeholder:text-ds-fg-muted focus:border-ds-primary focus:outline-none resize-none"
            />
          </div>

          {/* 提交按钮 */}
          <div className="flex justify-end gap-3 pt-4 border-t border-ds-border">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-md border border-ds-border text-ds-fg hover:bg-ds-surface"
            >
              取消
            </button>
            <button
              onClick={handleSubmit}
              disabled={createMutation.isPending || selectedStudents.length === 0 || !selectedRuleId}
              className="px-4 py-2 rounded-md bg-ds-primary text-white hover:bg-ds-primary/90 disabled:opacity-50"
            >
              {createMutation.isPending ? '提交中...' : `确认录入 (${selectedStudents.length}人)`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
