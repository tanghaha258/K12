import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Search, Users, Check, ChevronRight, Plus, Minus, 
  Calendar, FileText, RotateCcw, CheckCircle2, AlertCircle, User
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';

interface Student {
  id: string;
  studentNo: string;
  name: string;
  seatNo?: string;
  gender?: string;
}

interface MoralRule {
  id: string;
  name: string;
  category: string;
  scoreDelta: number;
  description?: string;
}

// 快捷创建规则弹窗
function QuickRuleModal({ onClose, onCreated }: { onClose: () => void; onCreated: (rule: MoralRule) => void }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('behavior');
  const [scoreDelta, setScoreDelta] = useState(-1);
  const [description, setDescription] = useState('');

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return api.post('/moral/rules', data);
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['moralRules'] });
      onCreated(res.data);
      onClose();
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
          <h3 className="text-lg font-semibold">快速创建规则</h3>
          <button onClick={onClose} className="text-ds-fg-muted hover:text-ds-fg">
            <span className="text-2xl">&times;</span>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ds-fg mb-1">规则名称 *</label>
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
            <p className="text-xs text-ds-fg-muted mt-1">负数为扣分，正数为加分</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-ds-fg mb-1">说明（可选）</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="请输入规则说明..."
              rows={2}
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
              {createMutation.isPending ? '创建中...' : '创建并选择'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// 步骤指示器
function StepIndicator({ currentStep, steps }: { currentStep: number; steps: string[] }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {steps.map((step, index) => (
        <div key={step} className="flex items-center">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
            index < currentStep ? 'bg-ds-success text-white' :
            index === currentStep ? 'bg-ds-primary text-white' :
            'bg-ds-surface text-ds-fg-muted'
          }`}>
            {index < currentStep ? <CheckCircle2 className="w-5 h-5" /> : index + 1}
          </div>
          <span className={`ml-2 text-sm ${
            index <= currentStep ? 'text-ds-fg font-medium' : 'text-ds-fg-muted'
          }`}>
            {step}
          </span>
          {index < steps.length - 1 && (
            <ChevronRight className="w-4 h-4 mx-3 text-ds-fg-muted" />
          )}
        </div>
      ))}
    </div>
  );
}

export default function MoralEventEntry() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  
  // 步骤状态：0-选班级, 1-选学生, 2-选规则, 3-确认提交
  const [currentStep, setCurrentStep] = useState(0);
  
  // 表单数据
  const [selectedGradeId, setSelectedGradeId] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedStudents, setSelectedStudents] = useState<Student[]>([]);
  const [selectedRuleId, setSelectedRuleId] = useState('');
  const [occurredAt, setOccurredAt] = useState(new Date().toISOString().slice(0, 16));
  const [description, setDescription] = useState('');
  const [note, setNote] = useState(''); // 备注（可选）
  const [searchKeyword, setSearchKeyword] = useState('');
  const [showPositiveOnly, setShowPositiveOnly] = useState(false);
  const [showNegativeOnly, setShowNegativeOnly] = useState(false);
  const [showQuickRuleModal, setShowQuickRuleModal] = useState(false);

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
      alert('录入成功！');
      // 显示成功提示后返回
      setTimeout(() => {
        navigate('/moral');
      }, 1500);
    },
    onError: (error: any) => {
      console.error('录入失败:', error);
      alert('录入失败: ' + (error.response?.data?.message || error.message || '未知错误'));
    },
  });

  // 过滤规则
  const filteredRules = useMemo(() => {
    if (!rules) return [];
    let result = rules;
    
    // 搜索过滤
    if (searchKeyword) {
      const keyword = searchKeyword.toLowerCase();
      result = result.filter((r: any) => r.name.toLowerCase().includes(keyword));
    }
    
    // 分值过滤
    if (showPositiveOnly) result = result.filter((r: any) => r.score > 0);
    if (showNegativeOnly) result = result.filter((r: any) => r.score < 0);
    
    return result;
  }, [rules, searchKeyword, showPositiveOnly, showNegativeOnly]);

  // 过滤学生
  const filteredStudents = useMemo(() => {
    if (!students) return [];
    if (!searchKeyword) return students;
    
    const keyword = searchKeyword.toLowerCase();
    return students.filter((s: any) => {
      const name = s.name || s.user?.name || '';
      return name.toLowerCase().includes(keyword) ||
        s.studentNo.toLowerCase().includes(keyword) ||
        (s.seatNo && s.seatNo.includes(keyword));
    });
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

  // 获取选中的班级
  const selectedClass = classes?.find((c: any) => c.id === selectedClassId);
  const selectedGrade = grades?.find((g: any) => g.id === selectedGradeId);

  // 提交表单
  const handleSubmit = () => {
    if (selectedStudents.length === 0 || !selectedRuleId || !selectedRule) return;

    // 批量创建格式：studentIds 数组 + 规则信息
    const data = {
      studentIds: selectedStudents.map(s => s.id),
      ruleId: selectedRuleId,
      category: selectedRule.category,
      itemName: selectedRule.name,
      scoreDelta: selectedRule.score,
      note: note || description || undefined,
      occurredAt: new Date(occurredAt).toISOString(),
    };

    createMutation.mutate(data);
  };

  // 下一步
  const handleNext = () => {
    if (currentStep === 0 && !selectedClassId) {
      alert('请选择班级');
      return;
    }
    if (currentStep === 1 && selectedStudents.length === 0) {
      alert('请至少选择一名学生');
      return;
    }
    if (currentStep === 2 && !selectedRuleId) {
      alert('请选择德育规则');
      return;
    }
    setCurrentStep(prev => prev + 1);
  };

  // 上一步
  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
  };

  // 重置
  const handleReset = () => {
    if (confirm('确定要重置所有选择吗？')) {
      setSelectedStudents([]);
      setSelectedRuleId('');
      setDescription('');
      setCurrentStep(0);
    }
  };

  const steps = ['选择班级', '选择学生', '选择规则', '确认提交'];

  return (
    <div className="min-h-screen bg-ds-bg">
      {/* Header */}
      <div className="surface-card border-b border-ds-border sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/moral')}
                className="flex items-center gap-2 text-ds-fg-muted hover:text-ds-fg"
              >
                <ArrowLeft className="h-5 w-5" />
                返回
              </button>
              <h1 className="text-xl font-bold text-ds-fg">德育事件录入</h1>
            </div>
            <button
              onClick={handleReset}
              className="flex items-center gap-2 text-sm text-ds-fg-muted hover:text-ds-fg"
            >
              <RotateCcw className="h-4 w-4" />
              重置
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* 步骤指示器 */}
        <StepIndicator currentStep={currentStep} steps={steps} />

        {/* 步骤 0: 选择班级 */}
        {currentStep === 0 && (
          <div className="space-y-6">
            <div className="surface-card border border-ds-border rounded-lg p-6">
              <h2 className="text-lg font-semibold text-ds-fg mb-4">选择班级</h2>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-ds-fg mb-2">年级</label>
                  <select
                    value={selectedGradeId}
                    onChange={(e) => {
                      setSelectedGradeId(e.target.value);
                      setSelectedClassId('');
                    }}
                    className="w-full rounded-md border border-ds-border bg-ds-surface px-4 py-3 text-ds-fg focus:border-ds-primary focus:outline-none"
                  >
                    <option value="">请选择年级</option>
                    {grades?.map((grade: any) => (
                      <option key={grade.id} value={grade.id}>{grade.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-ds-fg mb-2">班级</label>
                  <select
                    value={selectedClassId}
                    onChange={(e) => setSelectedClassId(e.target.value)}
                    disabled={!selectedGradeId}
                    className="w-full rounded-md border border-ds-border bg-ds-surface px-4 py-3 text-ds-fg focus:border-ds-primary focus:outline-none disabled:opacity-50"
                  >
                    <option value="">请选择班级</option>
                    {classes?.map((cls: any) => (
                      <option key={cls.id} value={cls.id}>{cls.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedClass && (
                <div className="p-4 bg-ds-success/5 border border-ds-success/20 rounded-lg">
                  <div className="flex items-center gap-2 text-ds-success">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="font-medium">已选择：{selectedGrade?.name} {selectedClass.name}</span>
                  </div>
                  <p className="text-sm text-ds-fg-muted mt-1">
                    该班级共有 {students?.length || 0} 名学生
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleNext}
                disabled={!selectedClassId}
                className="flex items-center gap-2 px-6 py-3 bg-ds-primary text-white rounded-lg hover:bg-ds-primary/90 disabled:opacity-50 font-medium"
              >
                下一步：选择学生
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {/* 步骤 1: 选择学生 */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="surface-card border border-ds-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-ds-fg">
                  选择学生 
                  <span className="text-sm font-normal text-ds-fg-muted ml-2">
                    (已选 {selectedStudents.length} 人)
                  </span>
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleSelectAll}
                    className="text-sm text-ds-primary hover:text-ds-primary/80"
                  >
                    {selectedStudents.length === filteredStudents.length ? '取消全选' : '全选'}
                  </button>
                </div>
              </div>

              {/* 搜索 */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-ds-fg-muted" />
                <input
                  type="text"
                  placeholder="搜索姓名、学号、座位号..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="w-full rounded-md border border-ds-border bg-ds-surface pl-10 pr-4 py-3 text-ds-fg placeholder:text-ds-fg-muted focus:border-ds-primary focus:outline-none"
                />
              </div>

              {/* 学生列表 */}
              <div className="border border-ds-border rounded-lg overflow-hidden">
                <div className="max-h-96 overflow-auto">
                  <table className="w-full">
                    <thead className="bg-ds-surface sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-ds-fg w-16">选择</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-ds-fg">学号</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-ds-fg">姓名</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-ds-fg">座位号</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-ds-fg">性别</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.map((student: any) => {
                        const isSelected = selectedStudents.some(s => s.id === student.id);
                        const studentName = student.name || student.user?.name || '未知';
                        return (
                          <tr 
                            key={student.id} 
                            className={`border-t border-ds-border cursor-pointer transition-colors ${
                              isSelected ? 'bg-ds-primary/5' : 'hover:bg-ds-surface-2/50'
                            }`}
                            onClick={() => toggleStudent(student)}
                          >
                            <td className="px-4 py-3">
                              <div className={`w-6 h-6 rounded border flex items-center justify-center transition-colors ${
                                isSelected ? 'bg-ds-primary border-ds-primary' : 'border-ds-border'
                              }`}>
                                {isSelected && <Check className="h-4 w-4 text-white" />}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-ds-fg-muted">{student.studentNo}</td>
                            <td className="px-4 py-3">
                              <span className="font-medium text-ds-fg">{studentName}</span>
                            </td>
                            <td className="px-4 py-3 text-sm text-ds-fg-muted">{student.seatNo || '-'}</td>
                            <td className="px-4 py-3 text-sm text-ds-fg-muted">
                              {student.gender === 'male' ? '男' : student.gender === 'female' ? '女' : '-'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 已选学生展示 */}
              {selectedStudents.length > 0 && (
                <div className="mt-4 p-4 bg-ds-surface rounded-lg">
                  <p className="text-sm text-ds-fg-muted mb-2">已选学生：</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedStudents.map((student: any) => (
                      <span 
                        key={student.id}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-ds-primary/10 text-ds-primary text-sm"
                      >
                        {student.name || student.user?.name || '未知'}
                        <button 
                          onClick={() => toggleStudent(student)}
                          className="hover:text-ds-danger"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between">
              <button
                onClick={handleBack}
                className="px-6 py-3 border border-ds-border text-ds-fg rounded-lg hover:bg-ds-surface"
              >
                上一步
              </button>
              <button
                onClick={handleNext}
                disabled={selectedStudents.length === 0}
                className="flex items-center gap-2 px-6 py-3 bg-ds-primary text-white rounded-lg hover:bg-ds-primary/90 disabled:opacity-50 font-medium"
              >
                下一步：选择规则
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {/* 步骤 2: 选择规则 */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="surface-card border border-ds-border rounded-lg p-6">
              <h2 className="text-lg font-semibold text-ds-fg mb-4">选择德育规则</h2>

              {/* 规则搜索和筛选 */}
              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ds-fg-muted" />
                  <input
                    type="text"
                    placeholder="搜索规则名称..."
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    className="w-full rounded-md border border-ds-border bg-ds-surface pl-9 pr-4 py-2 text-sm text-ds-fg placeholder:text-ds-fg-muted focus:border-ds-primary focus:outline-none"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setShowPositiveOnly(false); setShowNegativeOnly(false); }}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      !showPositiveOnly && !showNegativeOnly 
                        ? 'bg-ds-primary text-white' 
                        : 'bg-ds-surface text-ds-fg border border-ds-border'
                    }`}
                  >
                    全部
                  </button>
                  <button
                    onClick={() => { setShowPositiveOnly(true); setShowNegativeOnly(false); }}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      showPositiveOnly 
                        ? 'bg-ds-success text-white' 
                        : 'bg-ds-surface text-ds-fg border border-ds-border'
                    }`}
                  >
                    加分
                  </button>
                  <button
                    onClick={() => { setShowPositiveOnly(false); setShowNegativeOnly(true); }}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      showNegativeOnly 
                        ? 'bg-ds-danger text-white' 
                        : 'bg-ds-surface text-ds-fg border border-ds-border'
                    }`}
                  >
                    扣分
                  </button>
                </div>
              </div>

              {/* 规则列表 - 更紧凑的卡片 */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 max-h-80 overflow-auto">
                {filteredRules.map((rule: any) => {
                  const isSelected = selectedRuleId === rule.id;
                  const isPositive = rule.score > 0;
                  return (
                    <div
                      key={rule.id}
                      onClick={() => setSelectedRuleId(rule.id)}
                      className={`p-2 rounded-md border cursor-pointer transition-all ${
                        isSelected 
                          ? 'border-ds-primary bg-ds-primary/10' 
                          : 'border-ds-border hover:border-ds-primary/50 bg-ds-surface'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-ds-fg text-sm truncate flex-1">{rule.name}</span>
                        <span className={`text-sm font-bold ml-2 ${isPositive ? 'text-ds-success' : 'text-ds-danger'}`}>
                          {isPositive ? '+' : ''}{rule.score}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {filteredRules.length === 0 && (
                <div className="text-center py-8 text-ds-fg-muted">
                  <AlertCircle className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>暂无符合条件的规则</p>
                  <button
                    onClick={() => setShowQuickRuleModal(true)}
                    className="mt-4 px-4 py-2 bg-ds-primary text-white rounded-lg hover:bg-ds-primary/90 text-sm"
                  >
                    + 快速创建规则
                  </button>
                </div>
              )}

              {/* 快捷创建规则按钮（始终显示） */}
              <div className="mt-4 pt-4 border-t border-ds-border">
                <button
                  onClick={() => setShowQuickRuleModal(true)}
                  className="flex items-center gap-2 text-sm text-ds-primary hover:text-ds-primary/80"
                >
                  <Plus className="h-4 w-4" />
                  没有找到想要的规则？点击快速创建
                </button>
              </div>

              {/* 备注（可选） */}
              <div className="mt-6 pt-4 border-t border-ds-border">
                <label className="block text-sm font-medium text-ds-fg mb-2">
                  备注（可选）
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="添加备注信息，例如：具体情况说明、后续跟进等..."
                  rows={3}
                  className="w-full rounded-md border border-ds-border bg-ds-surface px-3 py-2 text-sm text-ds-fg placeholder:text-ds-fg-muted focus:border-ds-primary focus:outline-none resize-none"
                />
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={handleBack}
                className="px-6 py-3 border border-ds-border text-ds-fg rounded-lg hover:bg-ds-surface"
              >
                上一步
              </button>
              <button
                onClick={handleNext}
                disabled={!selectedRuleId}
                className="flex items-center gap-2 px-6 py-3 bg-ds-primary text-white rounded-lg hover:bg-ds-primary/90 disabled:opacity-50 font-medium"
              >
                下一步：确认提交
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {/* 步骤 3: 确认提交 */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="surface-card border border-ds-border rounded-lg p-6">
              <h2 className="text-lg font-semibold text-ds-fg mb-4">确认信息</h2>

              {/* 确认卡片 */}
              <div className="space-y-4">
                {/* 班级信息 */}
                <div className="flex items-center gap-3 p-4 bg-ds-surface rounded-lg">
                  <Users className="h-5 w-5 text-ds-primary" />
                  <div>
                    <p className="text-sm text-ds-fg-muted">班级</p>
                    <p className="font-medium text-ds-fg">{selectedGrade?.name} {selectedClass?.name}</p>
                  </div>
                </div>

                {/* 学生信息 */}
                <div className="p-4 bg-ds-surface rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <Users className="h-5 w-5 text-ds-primary" />
                    <div>
                      <p className="text-sm text-ds-fg-muted">学生</p>
                      <p className="font-medium text-ds-fg">{selectedStudents.length} 人</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 pl-8">
                    {selectedStudents.map((s: any) => (
                      <span key={s.id} className="text-sm text-ds-fg">{s.name || s.user?.name || '未知'}</span>
                    ))}
                  </div>
                </div>

                {/* 规则信息 */}
                <div className="flex items-center gap-3 p-4 bg-ds-surface rounded-lg">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    selectedRule!.score > 0 ? 'bg-ds-success/10' : 'bg-ds-danger/10'
                  }`}>
                    {selectedRule!.score > 0 ? (
                      <Plus className="h-5 w-5 text-ds-success" />
                    ) : (
                      <Minus className="h-5 w-5 text-ds-danger" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-ds-fg-muted">德育规则</p>
                    <p className="font-medium text-ds-fg">{selectedRule!.name}</p>
                    <p className={`text-lg font-bold ${selectedRule!.score > 0 ? 'text-ds-success' : 'text-ds-danger'}`}>
                      {selectedRule!.score > 0 ? '+' : ''}{selectedRule!.score}分
                    </p>
                  </div>
                </div>

                {/* 时间 */}
                <div className="flex items-center gap-3 p-4 bg-ds-surface rounded-lg">
                  <Calendar className="h-5 w-5 text-ds-primary" />
                  <div>
                    <p className="text-sm text-ds-fg-muted">发生时间</p>
                    <p className="font-medium text-ds-fg">{new Date(occurredAt).toLocaleString('zh-CN')}</p>
                  </div>
                </div>

                {/* 描述 */}
                <div className="p-4 bg-ds-surface rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <FileText className="h-5 w-5 text-ds-primary" />
                    <p className="text-sm text-ds-fg-muted">描述</p>
                  </div>
                  <p className="text-sm text-ds-fg pl-8">{description || '无'}</p>
                </div>

                {/* 备注 */}
                {note && (
                  <div className="p-4 bg-ds-surface rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <FileText className="h-5 w-5 text-ds-warning" />
                      <p className="text-sm text-ds-fg-muted">备注</p>
                    </div>
                    <p className="text-sm text-ds-fg pl-8">{note}</p>
                  </div>
                )}

                {/* 录入人 */}
                <div className="flex items-center gap-3 p-4 bg-ds-surface rounded-lg">
                  <User className="h-5 w-5 text-ds-primary" />
                  <div>
                    <p className="text-sm text-ds-fg-muted">录入人</p>
                    <p className="font-medium text-ds-fg">{user?.name || user?.username || '未知'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={handleBack}
                className="px-6 py-3 border border-ds-border text-ds-fg rounded-lg hover:bg-ds-surface"
              >
                上一步
              </button>
              <button
                onClick={handleSubmit}
                disabled={createMutation.isPending}
                className="flex items-center gap-2 px-8 py-3 bg-ds-primary text-white rounded-lg hover:bg-ds-primary/90 disabled:opacity-50 font-medium text-lg"
              >
                {createMutation.isPending ? (
                  <>
                    <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                    提交中...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-5 w-5" />
                    确认录入 ({selectedStudents.length}人)
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 快捷创建规则弹窗 */}
      {showQuickRuleModal && (
        <QuickRuleModal
          onClose={() => setShowQuickRuleModal(false)}
          onCreated={(rule) => {
            setSelectedRuleId(rule.id);
          }}
        />
      )}
    </div>
  );
}
