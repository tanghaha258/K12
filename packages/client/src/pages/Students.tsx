import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { gradesApi, classesApi, studentsApi, dormsApi } from '@/lib/api';
import { Search, Plus, Edit2, Trash2, X, Download, Upload, FileSpreadsheet, CheckCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

interface Grade {
  id: string;
  name: string;
}

interface ClassItem {
  id: string;
  name: string;
  gradeId: string;
}

interface DormBuilding {
  id: string;
  name: string;
}

interface DormRoom {
  id: string;
  roomNo: string;
  buildingId: string;
  beds: number;
}

interface DormBed {
  id: string;
  bedNo: string;
  roomId: string;
  status: string;
}

interface Student {
  id: string;
  studentNo: string;
  gender: string;
  idCard?: string;
  entryYear: number;
  gradeId: string;
  classId: string;
  seatNo: string | null;
  dormBuilding: string | null;
  dormRoom: string | null;
  dormBed: string | null;
  boardingType: string;
  user: { id: string; name: string; account: string; status: string };
  grade: { id: string; name: string };
  class: { id: string; name: string };
}

export default function Students() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedGradeId, setSelectedGradeId] = useState<string>('');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [searchText, setSearchText] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Student | null>(null);
  const [formData, setFormData] = useState({
    studentNo: '',
    name: '',
    gender: '男',
    idCard: '',
    entryYear: new Date().getFullYear(),
    gradeId: '',
    classId: '',
    seatNo: '',
    dormBuilding: '',
    dormRoom: '',
    dormBed: '',
    boardingType: 'day',
  });
  const [error, setError] = useState('');
  const [formErrors, setFormErrors] = useState<{ idCard?: string }>({});
  const [importData, setImportData] = useState<{
    file: File | null;
    preview: any[];
    errors: { row: number; message: string }[];
  }>({ file: null, preview: [], errors: [] });

  const validateIdCard = (idCard: string) => {
    if (!idCard) return true;
    const idCardRegex = /^[1-9]\d{5}(19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/;
    return idCardRegex.test(idCard);
  };

  const validateForm = () => {
    const errors: { idCard?: string } = {};
    if (formData.idCard && !validateIdCard(formData.idCard)) {
      errors.idCard = '请输入正确的身份证号（18位）';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const { data: grades, isLoading: gradesLoading, error: gradesError } = useQuery({
    queryKey: ['grades'],
    queryFn: async () => {
      const res = await gradesApi.list();
      return res.data as Grade[];
    },
  });

  const { data: classes, isLoading: classesLoading, error: classesError } = useQuery({
    queryKey: ['classes', selectedGradeId],
    queryFn: async () => {
      const res = await classesApi.list(selectedGradeId ? { gradeId: selectedGradeId } : undefined);
      return res.data as ClassItem[];
    },
  });

  const { data: students, isLoading: studentsLoading, error: studentsError } = useQuery({
    queryKey: ['students', selectedGradeId, selectedClassId, searchText],
    queryFn: async () => {
      const res = await studentsApi.list({
        gradeId: selectedGradeId || undefined,
        classId: selectedClassId || undefined,
        search: searchText || undefined,
      });
      return res.data as Student[];
    },
  });

  // 获取宿舍数据
  const { data: dormBuildings } = useQuery({
    queryKey: ['dorm-buildings'],
    queryFn: async () => {
      const res = await dormsApi.listBuildings();
      return res.data as DormBuilding[];
    },
    enabled: showModal,
  });

  const { data: dormRooms } = useQuery({
    queryKey: ['dorm-rooms', formData.dormBuilding],
    queryFn: async () => {
      const building = dormBuildings?.find(b => b.name === formData.dormBuilding);
      if (!building) return [];
      const res = await dormsApi.listRooms(building.id);
      return res.data as DormRoom[];
    },
    enabled: !!formData.dormBuilding && showModal,
  });

  const { data: dormBeds } = useQuery({
    queryKey: ['dorm-beds', formData.dormRoom],
    queryFn: async () => {
      const room = dormRooms?.find(r => r.roomNo === formData.dormRoom);
      if (!room) return [];
      const res = await dormsApi.listBeds(room.id);
      return res.data as DormBed[];
    },
    enabled: !!formData.dormRoom && showModal,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => studentsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      closeModal();
    },
    onError: (err: any) => setError(err.response?.data?.message || '创建失败'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => studentsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      closeModal();
    },
    onError: (err: any) => setError(err.response?.data?.message || '更新失败'),
  });

  const updateProfileMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => studentsApi.updateProfile(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      closeModal();
    },
    onError: (err: any) => setError(err.response?.data?.message || '更新失败'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => studentsApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['students'] }),
    onError: (err: any) => alert(err.response?.data?.message || '删除失败'),
  });

  const openCreateModal = () => {
    setEditingStudent(null);
    setFormData({
      studentNo: '',
      name: '',
      gender: '男',
      idCard: '',
      entryYear: new Date().getFullYear(),
      gradeId: selectedGradeId || grades?.[0]?.id || '',
      classId: selectedClassId || '',
      seatNo: '',
      dormBuilding: '',
      dormRoom: '',
      dormBed: '',
      boardingType: 'day',
    });
    setError('');
    setShowModal(true);
  };

  const openEditModal = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      studentNo: student.studentNo,
      name: student.user.name,
      gender: student.gender,
      idCard: student.idCard || '',
      entryYear: student.entryYear,
      gradeId: student.gradeId,
      classId: student.classId,
      seatNo: student.seatNo || '',
      dormBuilding: student.dormBuilding || '',
      dormRoom: student.dormRoom || '',
      dormBed: student.dormBed || '',
      boardingType: student.boardingType,
    });
    setError('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingStudent(null);
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    if (editingStudent) {
      if (isAdmin) {
        updateMutation.mutate({ id: editingStudent.id, data: {
          studentNo: formData.studentNo,
          name: formData.name,
          gender: formData.gender,
          idCard: formData.idCard,
          entryYear: formData.entryYear,
          classId: formData.classId,
          seatNo: formData.seatNo,
          dormBuilding: formData.dormBuilding,
          dormRoom: formData.dormRoom,
          dormBed: formData.dormBed,
          boardingType: formData.boardingType,
        }});
      } else {
        updateProfileMutation.mutate({ id: editingStudent.id, data: {
          classId: formData.classId,
          seatNo: formData.seatNo,
          dormBuilding: formData.dormBuilding,
          dormRoom: formData.dormRoom,
          dormBed: formData.dormBed,
          boardingType: formData.boardingType,
        }});
      }
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = () => {
    if (deleteConfirm) {
      deleteMutation.mutate(deleteConfirm.id);
      setDeleteConfirm(null);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportData({ file, preview: [], errors: [] });
    const mockPreview = [
      { studentNo: '2024001', name: '张三', gender: '男', gradeName: '2024级', className: '高一(1)班' },
      { studentNo: '2024002', name: '李四', gender: '女', gradeName: '2024级', className: '高一(1)班' },
    ];
    setImportData(prev => ({ ...prev, preview: mockPreview }));
  };

  const handleImport = () => {
    alert('批量导入功能将在后续实现');
    setShowImportModal(false);
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      ACTIVE: 'bg-ds-success/20 text-ds-success',
      INACTIVE: 'bg-ds-fg-muted/20 text-ds-fg-muted',
      PENDING: 'bg-ds-warning/20 text-ds-warning',
    };
    const labels: Record<string, string> = { ACTIVE: '正常', INACTIVE: '停用', PENDING: '待激活' };
    return (
      <span className={`rounded-full px-2 py-0.5 text-xs ${styles[status] || styles.ACTIVE}`}>
        {labels[status] || status}
      </span>
    );
  };

  const formatDorm = (student: Student) => {
    if (!student.dormBuilding && !student.dormRoom && !student.dormBed) return '-';
    const parts = [];
    if (student.dormBuilding) parts.push(student.dormBuilding);
    if (student.dormRoom) parts.push(student.dormRoom);
    if (student.dormBed) parts.push(student.dormBed + '号床');
    return parts.join(' ');
  };

  const isLoading = gradesLoading || classesLoading || studentsLoading;
  const hasError = gradesError || classesError || studentsError;
  const filteredClasses = formData.gradeId ? classes?.filter(c => c.gradeId === formData.gradeId) : classes;
  const coreFieldsDisabled = !!(editingStudent && !isAdmin);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ds-fg">学生管理</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 rounded-md bg-ds-surface-2 px-4 py-2 text-sm text-ds-fg transition-colors hover:bg-ds-surface focus:outline-none focus:ring-2 focus:ring-ds-primary/20"
          >
            <Upload className="h-4 w-4" />
            批量导入
          </button>
          <button className="flex items-center gap-2 rounded-md bg-ds-surface-2 px-4 py-2 text-sm text-ds-fg transition-colors hover:bg-ds-surface focus:outline-none focus:ring-2 focus:ring-ds-primary/20">
            <Download className="h-4 w-4" />
            导出
          </button>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 rounded-md bg-ds-primary px-4 py-2 text-sm text-white transition-colors hover:bg-ds-primary/90 focus:outline-none focus:ring-2 focus:ring-ds-primary/20"
          >
            <Plus className="h-4 w-4" />
            新增学生
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Select value={selectedGradeId || 'all'} onValueChange={(v) => { setSelectedGradeId(v === 'all' ? '' : v); setSelectedClassId(''); }}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="全部年级" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部年级</SelectItem>
            {grades?.map((grade) => (
              <SelectItem key={grade.id} value={grade.id}>{grade.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedClassId || 'all'} onValueChange={(v) => setSelectedClassId(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="全部班级" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部班级</SelectItem>
            {classes?.map((cls) => (
              <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ds-fg-muted" />
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="搜索学号或姓名..."
            className="h-9 w-full rounded-md border border-ds-border bg-ds-surface py-2 pl-10 pr-4 text-sm text-ds-fg outline-none transition-colors placeholder:text-ds-fg-subtle focus:border-ds-primary focus:ring-2 focus:ring-ds-primary/20"
          />
        </div>
      </div>

      <div className="surface-card overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-ds-fg-muted">加载中...</div>
        ) : hasError ? (
          <div className="p-8 text-center text-ds-danger">
            加载失败，请刷新页面重试
            <p className="mt-2 text-xs text-ds-fg-muted">
              {String(gradesError || classesError || studentsError)}
            </p>
          </div>
        ) : students?.length === 0 ? (
          <div className="p-8 text-center text-ds-fg-muted">暂无学生数据</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-ds-border bg-ds-surface">
                <th className="px-4 py-3 text-left text-sm font-medium text-ds-fg-muted">学号</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-ds-fg-muted">姓名</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-ds-fg-muted">性别</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-ds-fg-muted">年级</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-ds-fg-muted">班级</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-ds-fg-muted">座位号</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-ds-fg-muted">宿舍</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-ds-fg-muted">住宿</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-ds-fg-muted">状态</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-ds-fg-muted">操作</th>
              </tr>
            </thead>
            <tbody>
              {students?.map((student) => (
                <tr key={student.id} className="border-b border-ds-divider transition-colors hover:bg-ds-surface">
                  <td className="px-4 py-3 text-sm text-ds-fg tabular-nums">{student.studentNo}</td>
                  <td className="px-4 py-3 text-sm font-medium text-ds-fg">{student.user.name}</td>
                  <td className="px-4 py-3 text-sm text-ds-fg-muted">{student.gender}</td>
                  <td className="px-4 py-3 text-sm text-ds-fg-muted">{student.grade?.name}</td>
                  <td className="px-4 py-3 text-sm text-ds-fg-muted">{student.class?.name}</td>
                  <td className="px-4 py-3 text-sm text-ds-fg-muted tabular-nums">{student.seatNo || '-'}</td>
                  <td className="px-4 py-3 text-sm text-ds-fg-muted">{formatDorm(student)}</td>
                  <td className="px-4 py-3 text-sm text-ds-fg-muted">{student.boardingType === 'boarding' ? '住校' : '走读'}</td>
                  <td className="px-4 py-3">{getStatusBadge(student.user.status)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEditModal(student)}
                        className="rounded p-1.5 text-ds-fg-muted transition-colors hover:bg-ds-surface-2 hover:text-ds-fg focus:outline-none focus:ring-2 focus:ring-ds-primary/20"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(student)}
                        className="rounded p-1.5 text-ds-fg-muted transition-colors hover:bg-ds-danger/20 hover:text-ds-danger focus:outline-none focus:ring-2 focus:ring-ds-danger/20"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ds-overlay/50 backdrop-blur-sm">
          <div className="w-full max-w-2xl glass-card max-h-[90vh] overflow-y-auto p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-ds-fg">{editingStudent ? '编辑学生' : '新增学生'}</h2>
              <button onClick={closeModal} className="text-ds-fg-muted transition-colors hover:text-ds-fg"><X className="h-5 w-5" /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <div className="rounded-md bg-ds-danger/10 px-4 py-3 text-sm text-ds-danger">{error}</div>}

              {(!editingStudent || isAdmin) && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1.5 block text-sm text-ds-fg-muted">
                        学号 * {editingStudent && !isAdmin && <span className="text-ds-warning">(需审核)</span>}
                      </label>
                      <input
                        type="text"
                        value={formData.studentNo}
                        onChange={(e) => setFormData({ ...formData, studentNo: e.target.value })}
                        disabled={coreFieldsDisabled}
                        className="w-full rounded-md border border-ds-border bg-ds-surface px-4 py-2.5 text-ds-fg outline-none transition-colors focus:border-ds-primary focus:ring-2 focus:ring-ds-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        required
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm text-ds-fg-muted">
                        姓名 * {editingStudent && !isAdmin && <span className="text-ds-warning">(需审核)</span>}
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        disabled={coreFieldsDisabled}
                        className="w-full rounded-md border border-ds-border bg-ds-surface px-4 py-2.5 text-ds-fg outline-none transition-colors focus:border-ds-primary focus:ring-2 focus:ring-ds-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1.5 block text-sm text-ds-fg-muted">
                        性别 * {editingStudent && !isAdmin && <span className="text-ds-warning">(需审核)</span>}
                      </label>
                      <Select
                        value={formData.gender}
                        onValueChange={(v) => setFormData({ ...formData, gender: v })}
                        disabled={coreFieldsDisabled}
                      >
                        <SelectTrigger className={coreFieldsDisabled ? 'opacity-50 cursor-not-allowed' : ''}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="男">男</SelectItem>
                          <SelectItem value="女">女</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm text-ds-fg-muted">
                        入学年份 * {editingStudent && !isAdmin && <span className="text-ds-warning">(需审核)</span>}
                      </label>
                      <input
                        type="number"
                        value={formData.entryYear}
                        onChange={(e) => setFormData({ ...formData, entryYear: parseInt(e.target.value) })}
                        disabled={coreFieldsDisabled}
                        className="w-full rounded-md border border-ds-border bg-ds-surface px-4 py-2.5 text-ds-fg outline-none transition-colors focus:border-ds-primary focus:ring-2 focus:ring-ds-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        required
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm text-ds-fg-muted">年级 *</label>
                  <Select value={formData.gradeId} onValueChange={(v) => setFormData({ ...formData, gradeId: v, classId: '' })}>
                    <SelectTrigger><SelectValue placeholder="请选择年级" /></SelectTrigger>
                    <SelectContent>
                      {grades?.map((grade) => (<SelectItem key={grade.id} value={grade.id}>{grade.name}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm text-ds-fg-muted">班级 *</label>
                  <Select value={formData.classId} onValueChange={(v) => setFormData({ ...formData, classId: v })}>
                    <SelectTrigger><SelectValue placeholder="请选择班级" /></SelectTrigger>
                    <SelectContent>
                      {filteredClasses?.map((cls) => (<SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm text-ds-fg-muted">座位号</label>
                  <input type="text" value={formData.seatNo} onChange={(e) => setFormData({ ...formData, seatNo: e.target.value })} placeholder="如：A01" className="w-full rounded-md border border-ds-border bg-ds-surface px-4 py-2.5 text-ds-fg outline-none transition-colors placeholder:text-ds-fg-subtle focus:border-ds-primary focus:ring-2 focus:ring-ds-primary/20" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm text-ds-fg-muted">住宿类型</label>
                  <Select value={formData.boardingType} onValueChange={(v) => setFormData({ ...formData, boardingType: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="day">走读</SelectItem>
                      <SelectItem value="boarding">住校</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {formData.boardingType === 'boarding' && (
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="mb-1.5 block text-sm text-ds-fg-muted">宿舍楼栋</label>
                    <Select 
                      value={formData.dormBuilding} 
                      onValueChange={(v) => setFormData({ ...formData, dormBuilding: v, dormRoom: '', dormBed: '' })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="选择楼栋" />
                      </SelectTrigger>
                      <SelectContent>
                        {dormBuildings?.map((building) => (
                          <SelectItem key={building.id} value={building.name}>
                            {building.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm text-ds-fg-muted">宿舍房间</label>
                    <Select 
                      value={formData.dormRoom} 
                      onValueChange={(v) => setFormData({ ...formData, dormRoom: v, dormBed: '' })}
                      disabled={!formData.dormBuilding}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={formData.dormBuilding ? "选择房间" : "请先选择楼栋"} />
                      </SelectTrigger>
                      <SelectContent>
                        {dormRooms?.map((room) => (
                          <SelectItem key={room.id} value={room.roomNo}>
                            {room.roomNo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm text-ds-fg-muted">床位号</label>
                    <Select 
                      value={formData.dormBed} 
                      onValueChange={(v) => setFormData({ ...formData, dormBed: v })}
                      disabled={!formData.dormRoom}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={formData.dormRoom ? "选择床位" : "请先选择房间"} />
                      </SelectTrigger>
                      <SelectContent>
                        {dormBeds?.filter(bed => bed.status === 'empty' || (editingStudent && editingStudent.dormBed === bed.bedNo))?.map((bed) => (
                          <SelectItem key={bed.id} value={bed.bedNo}>
                            {bed.bedNo}号床 {bed.status === 'occupied' && '(已占用)'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-sm text-ds-fg-muted">身份证号</label>
                <input type="text" value={formData.idCard} onChange={(e) => { setFormData({ ...formData, idCard: e.target.value }); setFormErrors({ ...formErrors, idCard: undefined }); }} maxLength={18} placeholder="请输入18位身份证号" className={`w-full rounded-md border bg-ds-surface px-4 py-2.5 text-ds-fg outline-none transition-colors focus:ring-2 ${formErrors.idCard ? 'border-ds-danger focus:border-ds-danger focus:ring-ds-danger/20' : 'border-ds-border focus:border-ds-primary focus:ring-ds-primary/20'}`} />
                {formErrors.idCard && <p className="mt-1 text-xs text-ds-danger">{formErrors.idCard}</p>}
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeModal} className="flex-1 rounded-md border border-ds-border px-4 py-2.5 text-sm text-ds-fg transition-colors hover:bg-ds-surface-2 focus:outline-none focus:ring-2 focus:ring-ds-primary/20">取消</button>
                <button type="submit" disabled={createMutation.isPending || updateMutation.isPending || updateProfileMutation.isPending} className="flex-1 rounded-md bg-ds-primary px-4 py-2.5 text-sm text-white transition-colors hover:bg-ds-primary/90 focus:outline-none focus:ring-2 focus:ring-ds-primary/20 disabled:opacity-50">{createMutation.isPending || updateMutation.isPending || updateProfileMutation.isPending ? '保存中...' : '保存'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除学生「{deleteConfirm?.user.name}」吗？此操作不可撤销，将同时删除该学生的账号信息。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>确认删除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ds-overlay/50 backdrop-blur-sm">
          <div className="w-full max-w-3xl glass-card max-h-[90vh] overflow-y-auto p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-ds-fg">批量导入学生</h2>
              <button onClick={() => setShowImportModal(false)} className="text-ds-fg-muted transition-colors hover:text-ds-fg"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-6">
              <div>
                <h3 className="mb-3 text-sm font-medium text-ds-fg">步骤1: 上传Excel文件</h3>
                <div onClick={() => fileInputRef.current?.click()} className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-ds-border bg-ds-surface p-8 transition-colors hover:border-ds-primary hover:bg-ds-surface-2">
                  <FileSpreadsheet className="mb-2 h-10 w-10 text-ds-fg-muted" />
                  <p className="text-sm text-ds-fg-muted">{importData.file ? importData.file.name : '点击上传或拖拽Excel文件到此处'}</p>
                  <p className="mt-1 text-xs text-ds-fg-subtle">支持 .xlsx, .xls 格式</p>
                </div>
                <input ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={handleFileSelect} className="hidden" />
              </div>

              {importData.preview.length > 0 && (
                <div>
                  <h3 className="mb-3 text-sm font-medium text-ds-fg">步骤2: 数据预览</h3>
                  <div className="surface-card overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-ds-border bg-ds-surface">
                          <th className="px-3 py-2 text-left text-xs font-medium text-ds-fg-muted">学号</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-ds-fg-muted">姓名</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-ds-fg-muted">性别</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-ds-fg-muted">年级</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-ds-fg-muted">班级</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-ds-fg-muted">状态</th>
                        </tr>
                      </thead>
                      <tbody>
                        {importData.preview.map((row, i) => (
                          <tr key={i} className="border-b border-ds-divider">
                            <td className="px-3 py-2 text-xs text-ds-fg">{row.studentNo}</td>
                            <td className="px-3 py-2 text-xs text-ds-fg">{row.name}</td>
                            <td className="px-3 py-2 text-xs text-ds-fg-muted">{row.gender}</td>
                            <td className="px-3 py-2 text-xs text-ds-fg-muted">{row.gradeName}</td>
                            <td className="px-3 py-2 text-xs text-ds-fg-muted">{row.className}</td>
                            <td className="px-3 py-2"><span className="flex items-center gap-1 text-xs text-ds-success"><CheckCircle className="h-3 w-3" />校验通过</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="rounded-md bg-ds-surface-2 p-4">
                <h4 className="mb-2 text-sm font-medium text-ds-fg">导入规则说明</h4>
                <ul className="space-y-1 text-xs text-ds-fg-muted">
                  <li>• 学号必须唯一，不能与已有学生重复</li>
                  <li>• 年级名称必须与系统中的年级名称完全一致</li>
                  <li>• 班级名称必须与系统中的班级名称完全一致</li>
                  <li>• 性别只能填"男"或"女"</li>
                  <li>• 宿舍格式：楼栋+房间+床位，如"毓秀楼401-2号床"</li>
                </ul>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setShowImportModal(false)} className="flex-1 rounded-md border border-ds-border px-4 py-2.5 text-sm text-ds-fg transition-colors hover:bg-ds-surface-2 focus:outline-none focus:ring-2 focus:ring-ds-primary/20">取消</button>
                <button onClick={handleImport} disabled={!importData.file} className="flex-1 rounded-md bg-ds-primary px-4 py-2.5 text-sm text-white transition-colors hover:bg-ds-primary/90 focus:outline-none focus:ring-2 focus:ring-ds-primary/20 disabled:opacity-50">开始导入</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
