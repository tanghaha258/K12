import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import {
  Shield,
  Users,
  School,
  BookOpen,
  Check,
  Search,
  X,
  CheckSquare,
  Square,
  GraduationCap,
  UserCircle,
} from 'lucide-react';

interface User {
  id: string;
  name: string;
  account: string;
  role: string;
  student?: {
    studentNo: string;
    classId?: string;
    gradeId?: string;
    class?: { name: string; grade?: { id: string; name: string } };
  };
  teacher?: {
    teacherNo: string;
  };
}

interface Grade {
  id: string;
  name: string;
}

interface Class {
  id: string;
  name: string;
  gradeId: string;
  gradeName: string;
}

interface Subject {
  id: string;
  name: string;
  code: string;
}

interface DataScope {
  id: string;
  scopeType: string;
  scopeId: string;
}

const roleMap: Record<string, string> = {
  ADMIN: '超级管理员',
  SCHOOL_ADMIN: '学校管理员',
  GRADE_ADMIN: '年级主任',
  CLASS_TEACHER: '班主任',
  SUBJECT_TEACHER: '科任老师',
  STUDENT: '学生',
};

// 用户类型分组
const userTypeTabs = [
  { key: 'all', label: '全部', icon: Users },
  { key: 'student', label: '学生', icon: GraduationCap },
  { key: 'teacher', label: '教师', icon: UserCircle },
] as const;

// 数据范围类型
const scopeTabs = [
  { key: 'grades', label: '年级', icon: School },
  { key: 'classes', label: '班级', icon: Users },
  { key: 'subjects', label: '学科', icon: BookOpen },
] as const;

export default function DataScopes() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SCHOOL_ADMIN';

  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeUserTab, setActiveUserTab] = useState<'all' | 'student' | 'teacher'>('all');
  const [activeScopeTab, setActiveScopeTab] = useState<'grades' | 'classes' | 'subjects'>('grades');
  const [selectedScopes, setSelectedScopes] = useState<Set<string>>(new Set());

  // 获取所有用户列表
  const { data: usersData } = useQuery<{ users: User[]; total: number }>({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await api.get('/users');
      return res.data;
    },
    enabled: isAdmin,
  });

  const users = usersData?.users || [];

  // 获取年级列表
  const { data: grades } = useQuery<Grade[]>({
    queryKey: ['grades'],
    queryFn: async () => {
      const res = await api.get('/org/grades');
      return res.data;
    },
  });

  // 获取班级列表
  const { data: classes } = useQuery<Class[]>({
    queryKey: ['classes'],
    queryFn: async () => {
      const res = await api.get('/org/classes');
      return res.data;
    },
  });

  // 获取学科列表
  const { data: subjects } = useQuery<Subject[]>({
    queryKey: ['subjects'],
    queryFn: async () => {
      const res = await api.get('/dict/subjects/all');
      return res.data;
    },
  });

  // 获取用户数据范围
  const { data: userScopes } = useQuery<{
    scopes: DataScope[];
    grouped: { grades: DataScope[]; classes: DataScope[]; subjects: DataScope[] };
  }>({
    queryKey: ['datascope', selectedUserId],
    queryFn: async () => {
      if (!selectedUserId) return { scopes: [], grouped: { grades: [], classes: [], subjects: [] } };
      const res = await api.get(`/datascopes/user/${selectedUserId}`);
      return res.data;
    },
    enabled: !!selectedUserId,
  });

  // 过滤用户列表
  const filteredUsersByType = useMemo(() => {
    if (!users) return [];
    
    let filtered = users;
    
    // 按类型过滤
    if (activeUserTab === 'student') {
      filtered = users.filter((u) => u.role === 'STUDENT');
    } else if (activeUserTab === 'teacher') {
      filtered = users.filter((u) => 
        ['TEACHER', 'CLASS_TEACHER', 'SUBJECT_TEACHER', 'GRADE_ADMIN'].includes(u.role) ||
        u.teacher !== null
      );
    }
    
    // 按搜索词过滤
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.name.toLowerCase().includes(query) ||
          u.account.toLowerCase().includes(query) ||
          (u.student?.studentNo && u.student.studentNo.toLowerCase().includes(query)) ||
          (u.teacher?.teacherNo && u.teacher.teacherNo.toLowerCase().includes(query))
      );
    }
    
    return filtered;
  }, [users, activeUserTab, searchQuery]);

  // 获取当前选中的用户
  const selectedUser = useMemo(() => {
    return users?.find((u) => u.id === selectedUserId);
  }, [users, selectedUserId]);

  // 判断是否是学生
  const isStudent = selectedUser?.role === 'STUDENT';
  
  // 获取学生的本年级ID和本班级ID
  const studentGradeId = selectedUser?.student?.gradeId;
  const studentClassId = selectedUser?.student?.classId;

  // 过滤年级列表（学生只显示本年级）
  const filteredGrades = useMemo(() => {
    if (!grades) return [];
    if (isStudent && studentGradeId) {
      return grades.filter((g) => g.id === studentGradeId);
    }
    return grades;
  }, [grades, isStudent, studentGradeId]);

  // 过滤班级列表（学生只显示本年级的班级）
  const filteredClasses = useMemo(() => {
    if (!classes) return [];
    if (isStudent && studentGradeId) {
      return classes.filter((c) => c.gradeId === studentGradeId);
    }
    return classes;
  }, [classes, isStudent, studentGradeId]);

  // 设置数据范围
  const setScopesMutation = useMutation({
    mutationFn: ({ userId, scopes }: { userId: string; scopes: { scopeType: string; scopeId: string }[] }) =>
      api.post(`/datascopes/user/${userId}`, { scopes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['datascope', selectedUserId] });
      alert('数据范围设置成功');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || '设置失败');
    },
  });

  // 当选择用户变化时，更新选中的范围
  useEffect(() => {
    if (!selectedUser) return;
    
    const scopeTypeMap: Record<string, string> = {
      grades: 'GRADE',
      classes: 'CLASS',
      subjects: 'SUBJECT',
    };
    
    if (isStudent && studentGradeId && studentClassId) {
      // 学生：默认勾选本年级和本班
      if (activeScopeTab === 'grades') {
        setSelectedScopes(new Set([studentGradeId]));
      } else if (activeScopeTab === 'classes') {
        // 检查是否有已保存的数据范围
        const savedClassScopes = userScopes?.scopes
          .filter((s) => s.scopeType === 'CLASS')
          .map((s) => s.scopeId) || [];
        if (savedClassScopes.length > 0) {
          setSelectedScopes(new Set(savedClassScopes));
        } else {
          setSelectedScopes(new Set([studentClassId]));
        }
      }
    } else if (userScopes?.scopes) {
      // 非学生：使用已保存的数据范围
      const currentTypeScopes = userScopes.scopes
        .filter((s) => s.scopeType === scopeTypeMap[activeScopeTab])
        .map((s) => s.scopeId);
      setSelectedScopes(new Set(currentTypeScopes));
    } else {
      setSelectedScopes(new Set());
    }
  }, [userScopes, activeScopeTab, isStudent, studentGradeId, studentClassId, selectedUser]);

  const handleSelectUser = (user: User) => {
    setSelectedUserId(user.id);
    setSearchQuery(user.name);
    setSelectedScopes(new Set());
  };

  const handleClearSelection = () => {
    setSelectedUserId('');
    setSearchQuery('');
    setSelectedScopes(new Set());
  };

  const handleToggleScope = (scopeId: string) => {
    const newScopes = new Set(selectedScopes);
    if (newScopes.has(scopeId)) {
      newScopes.delete(scopeId);
    } else {
      newScopes.add(scopeId);
    }
    setSelectedScopes(newScopes);
  };

  // 全选当前类型的所有范围
  const handleSelectAll = () => {
    let allIds: string[] = [];
    if (activeScopeTab === 'grades' && filteredGrades) {
      allIds = filteredGrades.map((g) => g.id);
    } else if (activeScopeTab === 'classes') {
      allIds = filteredClasses.map((c) => c.id);
    } else if (activeScopeTab === 'subjects' && subjects) {
      allIds = subjects.map((s) => s.id);
    }
    setSelectedScopes(new Set(allIds));
  };

  // 清空当前类型的所有范围
  const handleClearAll = () => {
    setSelectedScopes(new Set());
  };

  const handleSaveScopes = () => {
    if (!selectedUserId) return;

    const scopeTypeMap: Record<string, string> = {
      grades: 'GRADE',
      classes: 'CLASS',
      subjects: 'SUBJECT',
    };

    // 获取其他类型的已选范围
    const otherScopes = userScopes?.scopes.filter(
      (s) => s.scopeType !== scopeTypeMap[activeScopeTab]
    ) || [];

    // 合并当前类型和其他类型的范围
    const allScopes = [
      ...otherScopes.map((s) => ({ scopeType: s.scopeType, scopeId: s.scopeId })),
      ...Array.from(selectedScopes).map((id) => ({
        scopeType: scopeTypeMap[activeScopeTab],
        scopeId: id,
      })),
    ];

    setScopesMutation.mutate({ userId: selectedUserId, scopes: allScopes });
  };

  if (!isAdmin) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <Shield className="w-16 h-16 text-ds-fg-muted mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-ds-fg mb-2">权限不足</h2>
          <p className="text-ds-fg-muted">只有管理员可以配置数据范围权限</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-ds-fg">数据范围权限</h1>
        <p className="text-sm text-ds-fg-muted mt-1">
          配置用户可以访问的年级、班级、学科范围
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 左侧：用户选择 */}
        <div className="surface-card border border-ds-border rounded-lg overflow-hidden">
          {/* 用户类型 Tab */}
          <div className="flex border-b border-ds-border">
            {userTypeTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => {
                    setActiveUserTab(tab.key);
                    setSelectedUserId('');
                    setSearchQuery('');
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                    activeUserTab === tab.key
                      ? 'bg-ds-primary/10 text-ds-primary border-b-2 border-ds-primary'
                      : 'text-ds-fg-muted hover:bg-ds-surface-2 hover:text-ds-fg'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* 搜索框 */}
          <div className="p-4 border-b border-ds-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ds-fg-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`搜索${activeUserTab === 'student' ? '学生' : activeUserTab === 'teacher' ? '教师' : '用户'}姓名或账号...`}
                className="w-full pl-10 pr-4 py-2 border border-ds-border rounded-md bg-ds-surface text-ds-fg focus:outline-none focus:ring-2 focus:ring-ds-primary/50"
              />
            </div>
          </div>

          {/* 用户列表 */}
          <div className="max-h-96 overflow-auto">
            {filteredUsersByType.length === 0 ? (
              <div className="p-8 text-center text-ds-fg-muted">
                暂无用户数据
              </div>
            ) : (
              filteredUsersByType.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleSelectUser(user)}
                  className={`w-full px-4 py-3 text-left border-b border-ds-border last:border-0 transition-colors ${
                    selectedUserId === user.id
                      ? 'bg-ds-primary/10 border-l-4 border-l-ds-primary'
                      : 'hover:bg-ds-surface-2 border-l-4 border-l-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-ds-fg">{user.name}</div>
                      <div className="text-xs text-ds-fg-muted mt-0.5">
                        {roleMap[user.role] || user.role}
                        {user.student?.studentNo && ` · 学号:${user.student.studentNo}`}
                        {user.teacher?.teacherNo && ` · 工号:${user.teacher.teacherNo}`}
                      </div>
                    </div>
                    {selectedUserId === user.id && (
                      <Check className="w-4 h-4 text-ds-primary" />
                    )}
                  </div>
                </button>
              ))
            )}
          </div>

          {/* 已选用户提示 */}
          {selectedUser && (
            <div className="p-3 bg-ds-primary/5 border-t border-ds-border">
              <div className="flex items-center justify-between">
                <span className="text-sm text-ds-fg">
                  已选择: <span className="font-medium">{selectedUser.name}</span>
                </span>
                <button
                  onClick={handleClearSelection}
                  className="p-1 text-ds-fg-muted hover:text-ds-danger transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 右侧：数据范围配置 */}
        <div className="surface-card border border-ds-border rounded-lg p-4">
          {!selectedUserId ? (
            <div className="h-full flex flex-col items-center justify-center text-ds-fg-muted py-12">
              <Shield className="w-12 h-12 mb-4 opacity-50" />
              <p>请先选择左侧用户</p>
            </div>
          ) : (
            <>
              {/* 用户信息 */}
              <div className="mb-4 p-3 bg-ds-surface-2 rounded-lg">
                <div className="font-medium text-ds-fg">{selectedUser.name}</div>
                <div className="text-sm text-ds-fg-muted">
                  {roleMap[selectedUser.role] || selectedUser.role}
                  {selectedUser.student?.class && ` · ${selectedUser.student.class.grade?.name || ''}${selectedUser.student.class.name}`}
                </div>
              </div>

              {/* Tabs - 学生不显示学科 */}
              <div className="flex border-b border-ds-border mb-4">
                {scopeTabs
                  .filter((tab) => !isStudent || tab.key !== 'subjects')
                  .map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.key}
                        onClick={() => setActiveScopeTab(tab.key as any)}
                        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                          activeScopeTab === tab.key
                            ? 'border-ds-primary text-ds-primary'
                            : 'border-transparent text-ds-fg-muted hover:text-ds-fg'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {tab.label}
                      </button>
                    );
                  })}
              </div>

              {/* 批量操作按钮 */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={handleSelectAll}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm border border-ds-border rounded-md hover:bg-ds-surface-2 transition-colors"
                >
                  <CheckSquare className="w-4 h-4" />
                  全选
                </button>
                <button
                  onClick={handleClearAll}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm border border-ds-border rounded-md hover:bg-ds-surface-2 transition-colors"
                >
                  <Square className="w-4 h-4" />
                  清空
                </button>
                <span className="ml-auto text-sm text-ds-fg-muted">
                  已选择 {selectedScopes.size} 项
                </span>
              </div>

              {/* 范围列表 */}
              <div className="space-y-2 max-h-64 overflow-auto">
                {activeScopeTab === 'grades' && filteredGrades?.map((grade) => (
                  <label
                    key={grade.id}
                    className="flex items-center gap-3 p-3 border border-ds-border rounded-md hover:bg-ds-surface-2 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedScopes.has(grade.id)}
                      onChange={() => handleToggleScope(grade.id)}
                      className="w-4 h-4 rounded border-ds-border text-ds-primary focus:ring-ds-primary"
                    />
                    <span className="flex-1 text-ds-fg">{grade.name}</span>
                  </label>
                ))}

                {activeScopeTab === 'classes' && filteredClasses?.map((cls) => (
                  <label
                    key={cls.id}
                    className="flex items-center gap-3 p-3 border border-ds-border rounded-md hover:bg-ds-surface-2 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedScopes.has(cls.id)}
                      onChange={() => handleToggleScope(cls.id)}
                      className="w-4 h-4 rounded border-ds-border text-ds-primary focus:ring-ds-primary"
                    />
                    <span className="flex-1 text-ds-fg">
                      {cls.gradeName} · {cls.name}
                    </span>
                  </label>
                ))}

                {activeScopeTab === 'subjects' && !isStudent && subjects?.map((subject) => (
                  <label
                    key={subject.id}
                    className="flex items-center gap-3 p-3 border border-ds-border rounded-md hover:bg-ds-surface-2 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedScopes.has(subject.id)}
                      onChange={() => handleToggleScope(subject.id)}
                      className="w-4 h-4 rounded border-ds-border text-ds-primary focus:ring-ds-primary"
                    />
                    <span className="flex-1 text-ds-fg">{subject.name}</span>
                    <span className="text-xs text-ds-fg-muted">{subject.code}</span>
                  </label>
                ))}
              </div>

              {/* 保存按钮 */}
              <div className="mt-4 pt-4 border-t border-ds-border">
                <button
                  onClick={handleSaveScopes}
                  disabled={setScopesMutation.isPending}
                  className="w-full py-2 bg-ds-primary text-white rounded-md hover:bg-ds-primary/90 disabled:opacity-50 transition-colors"
                >
                  {setScopesMutation.isPending ? '保存中...' : '保存数据范围'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
