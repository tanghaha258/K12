import { useState, ChangeEvent, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import {
  Building2,
  Bed,
  Users,
  Plus,
  Edit2,
  Trash2,
  Home,
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle,
  X,
} from 'lucide-react';

interface DormBuilding {
  id: string;
  name: string;
  floors: number;
  rooms: number;
  beds: number;
  remark?: string;
  status: string;
  createdAt: string;
}

interface DormRoom {
  id: string;
  buildingId: string;
  buildingName: string;
  roomNo: string;
  floor: number;
  capacity: number;
  beds: number;
  occupied: number;
  gender: string;
  remark?: string;
  status: string;
}

interface DormStatistics {
  buildings: number;
  rooms: number;
  beds: number;
  occupied: number;
  empty: number;
  occupancyRate: number;
  boardingStudents: number;
}

export default function Dorms() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SCHOOL_ADMIN';
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<'buildings' | 'rooms'>('buildings');
  const [selectedBuilding, setSelectedBuilding] = useState<string>('all');
  const [showBuildingModal, setShowBuildingModal] = useState(false);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingBuilding, setEditingBuilding] = useState<DormBuilding | null>(null);
  const [editingRoom, setEditingRoom] = useState<DormRoom | null>(null);
  const [importData, setImportData] = useState<{
    file: File | null;
    preview: any[];
    errors: { row: number; message: string }[];
  }>({ file: null, preview: [], errors: [] });

  // Form states
  const [buildingForm, setBuildingForm] = useState({
    name: '',
    floors: 1,
    remark: '',
  });

  const [roomForm, setRoomForm] = useState({
    buildingId: '',
    roomNo: '',
    floor: 1,
    capacity: 4,
    beds: 4,
    gender: 'male',
    remark: '',
  });

  // Queries
  const { data: statistics } = useQuery<DormStatistics>({
    queryKey: ['dorm-statistics'],
    queryFn: async () => {
      const res = await api.get('/dorms/statistics');
      return res.data;
    },
  });

  const { data: buildings } = useQuery<DormBuilding[]>({
    queryKey: ['dorm-buildings'],
    queryFn: async () => {
      const res = await api.get('/dorms/buildings');
      return res.data;
    },
  });

  const { data: rooms } = useQuery<DormRoom[]>({
    queryKey: ['dorm-rooms', selectedBuilding],
    queryFn: async () => {
      const url = selectedBuilding && selectedBuilding !== 'all'
        ? `/dorms/rooms?buildingId=${selectedBuilding}`
        : '/dorms/rooms';
      const res = await api.get(url);
      return res.data;
    },
  });

  // Mutations
  const createBuildingMutation = useMutation({
    mutationFn: (data: typeof buildingForm) => api.post('/dorms/buildings', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dorm-buildings'] });
      queryClient.invalidateQueries({ queryKey: ['dorm-statistics'] });
      setShowBuildingModal(false);
      setBuildingForm({ name: '', floors: 1, remark: '' });
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || '创建失败');
    },
  });

  const updateBuildingMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<DormBuilding> }) =>
      api.patch(`/dorms/buildings/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dorm-buildings'] });
      setShowBuildingModal(false);
      setEditingBuilding(null);
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || '更新失败');
    },
  });

  const deleteBuildingMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/dorms/buildings/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dorm-buildings'] });
      queryClient.invalidateQueries({ queryKey: ['dorm-statistics'] });
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || '删除失败');
    },
  });

  const createRoomMutation = useMutation({
    mutationFn: (data: typeof roomForm) => api.post('/dorms/rooms', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dorm-rooms'] });
      queryClient.invalidateQueries({ queryKey: ['dorm-statistics'] });
      setShowRoomModal(false);
      setRoomForm({
        buildingId: '',
        roomNo: '',
        floor: 1,
        capacity: 4,
        beds: 4,
        gender: 'male',
        remark: '',
      });
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || '创建失败');
    },
  });

  const updateRoomMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<DormRoom> }) =>
      api.patch(`/dorms/rooms/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dorm-rooms'] });
      queryClient.invalidateQueries({ queryKey: ['dorm-statistics'] });
      setShowRoomModal(false);
      setEditingRoom(null);
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || '更新失败');
    },
  });

  const deleteRoomMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/dorms/rooms/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dorm-rooms'] });
      queryClient.invalidateQueries({ queryKey: ['dorm-statistics'] });
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || '删除失败');
    },
  });

  const importBuildingsMutation = useMutation({
    mutationFn: (buildings: { name: string; floors?: number; remark?: string }[]) =>
      api.post('/dorms/buildings/import', { buildings }),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['dorm-buildings'] });
      queryClient.invalidateQueries({ queryKey: ['dorm-statistics'] });
      setShowImportModal(false);
      setImportData({ file: null, preview: [], errors: [] });
      if (res.data.failed > 0) {
        alert(`导入完成：成功 ${res.data.success} 条，失败 ${res.data.failed} 条\n${res.data.errors.map((e: any) => `第${e.row}行: ${e.message}`).join('\n')}`);
      } else {
        alert(`导入成功：共 ${res.data.success} 条数据`);
      }
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || '导入失败');
    },
  });

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const data = event.target?.result;
      if (data) {
        try {
          const lines = (data as string).split('\n').filter(line => line.trim());
          const headers = lines[0].split(',').map(h => h.trim());
          
          const preview: any[] = [];
          const errors: { row: number; message: string }[] = [];
          
          for (let i = 1; i < lines.length && i <= 5; i++) {
            const values = lines[i].split(',').map(v => v.trim());
            const row: any = {};
            headers.forEach((h, idx) => {
              row[h] = values[idx] || '';
            });
            
            if (!row['楼名']) {
              errors.push({ row: i + 1, message: '楼名不能为空' });
            }
            preview.push(row);
          }
          
          setImportData({ file, preview, errors });
        } catch (err) {
          alert('文件解析失败，请检查CSV格式');
        }
      }
    };
    reader.readAsText(file);
  };

  const handleImport = () => {
    if (!importData.file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const data = event.target?.result;
      if (data) {
        const lines = (data as string).split('\n').filter(line => line.trim());
        const headers = lines[0].split(',').map(h => h.trim());
        
        const buildings: { name: string; floors?: number; remark?: string }[] = [];
        
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim());
          const row: any = {};
          headers.forEach((h, idx) => {
            row[h] = values[idx] || '';
          });
          
          if (row['楼名']) {
            buildings.push({
              name: row['楼名'],
              floors: parseInt(row['楼层数']) || 1,
              remark: row['备注'] || undefined,
            });
          }
        }
        
        importBuildingsMutation.mutate(buildings);
      }
    };
    reader.readAsText(importData.file);
  };

  const downloadTemplate = () => {
    const csvContent = '楼名,楼层数,备注\n1号楼,6,男生宿舍\n2号楼,6,女生宿舍\n3号楼,5,混合宿舍';
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = '宿舍楼导入模板.csv';
    link.click();
  };

  const openEditBuildingModal = (building: DormBuilding) => {
    setEditingBuilding(building);
    setBuildingForm({
      name: building.name,
      floors: building.floors,
      remark: building.remark || '',
    });
    setShowBuildingModal(true);
  };

  const handleSaveBuilding = () => {
    if (editingBuilding) {
      updateBuildingMutation.mutate({ id: editingBuilding.id, data: buildingForm });
    } else {
      createBuildingMutation.mutate(buildingForm);
    }
  };

  const handleSaveRoom = () => {
    if (editingRoom) {
      updateRoomMutation.mutate({
        id: editingRoom.id,
        data: {
          roomNo: roomForm.roomNo,
          floor: roomForm.floor,
          capacity: roomForm.capacity,
          gender: roomForm.gender,
          remark: roomForm.remark,
        },
      });
    } else {
      createRoomMutation.mutate(roomForm);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ds-fg">宿舍管理</h1>
        {isAdmin && (
          <div className="flex gap-2">
            <button
              onClick={() => {
                setEditingBuilding(null);
                setBuildingForm({ name: '', floors: 1, remark: '' });
                setShowBuildingModal(true);
              }}
              className="flex items-center gap-2 rounded-md bg-ds-primary px-4 py-2 text-sm text-white transition-colors hover:bg-ds-primary/90"
            >
              <Plus className="h-4 w-4" />
              添加宿舍楼
            </button>

            <button
              onClick={() => {
                setRoomForm({
                  buildingId: buildings?.[0]?.id || '',
                  roomNo: '',
                  floor: 1,
                  capacity: 4,
                  beds: 4,
                  gender: 'male',
                  remark: '',
                });
                setShowRoomModal(true);
              }}
              className="flex items-center gap-2 rounded-md border border-ds-border bg-ds-surface px-4 py-2 text-sm text-ds-fg transition-colors hover:bg-ds-surface-2"
            >
              <Plus className="h-4 w-4" />
              添加房间
            </button>

            <button
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-2 rounded-md border border-ds-border bg-ds-surface px-4 py-2 text-sm text-ds-fg transition-colors hover:bg-ds-surface-2"
            >
              <Upload className="h-4 w-4" />
              批量导入
            </button>
          </div>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="surface-card rounded-lg p-4">
          <p className="text-sm text-ds-fg-muted">宿舍楼栋</p>
          <div className="flex items-center gap-2 mt-2">
            <Building2 className="w-5 h-5 text-ds-primary" />
            <span className="text-2xl font-bold text-ds-fg">{statistics?.buildings || 0}</span>
          </div>
        </div>
        <div className="surface-card rounded-lg p-4">
          <p className="text-sm text-ds-fg-muted">宿舍房间</p>
          <div className="flex items-center gap-2 mt-2">
            <Home className="w-5 h-5 text-ds-primary" />
            <span className="text-2xl font-bold text-ds-fg">{statistics?.rooms || 0}</span>
          </div>
        </div>
        <div className="surface-card rounded-lg p-4">
          <p className="text-sm text-ds-fg-muted">总床位数</p>
          <div className="flex items-center gap-2 mt-2">
            <Bed className="w-5 h-5 text-ds-primary" />
            <span className="text-2xl font-bold text-ds-fg">{statistics?.beds || 0}</span>
          </div>
        </div>
        <div className="surface-card rounded-lg p-4">
          <p className="text-sm text-ds-fg-muted">入住率</p>
          <div className="flex items-center gap-2 mt-2">
            <Users className="w-5 h-5 text-ds-primary" />
            <span className="text-2xl font-bold text-ds-fg">{statistics?.occupancyRate || 0}%</span>
          </div>
          <p className="text-xs text-ds-fg-muted mt-1">
            {statistics?.occupied || 0} / {statistics?.beds || 0}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-ds-border">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('buildings')}
            className={`px-4 py-2 border-b-2 text-sm font-medium transition-colors ${activeTab === 'buildings' ? 'border-ds-primary text-ds-primary' : 'border-transparent text-ds-fg-muted hover:text-ds-fg'}`}
          >
            宿舍楼栋
          </button>
          <button
            onClick={() => setActiveTab('rooms')}
            className={`px-4 py-2 border-b-2 text-sm font-medium transition-colors ${activeTab === 'rooms' ? 'border-ds-primary text-ds-primary' : 'border-transparent text-ds-fg-muted hover:text-ds-fg'}`}
          >
            宿舍房间
          </button>
        </div>
      </div>

      {/* Buildings Tab */}
      {activeTab === 'buildings' && (
        <div className="surface-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-ds-border bg-ds-surface">
                <th className="px-4 py-3 text-left text-sm font-medium text-ds-fg-muted">楼栋名称</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-ds-fg-muted">楼层数</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-ds-fg-muted">房间数</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-ds-fg-muted">床位数</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-ds-fg-muted">状态</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-ds-fg-muted">操作</th>
              </tr>
            </thead>
            <tbody>
              {buildings?.map((building) => (
                <tr key={building.id} className="border-b border-ds-divider transition-colors hover:bg-ds-surface">
                  <td className="px-4 py-3 text-sm font-medium text-ds-fg">{building.name}</td>
                  <td className="px-4 py-3 text-sm text-ds-fg-muted">{building.floors}</td>
                  <td className="px-4 py-3 text-sm text-ds-fg-muted">{building.rooms}</td>
                  <td className="px-4 py-3 text-sm text-ds-fg-muted">{building.beds}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 text-xs rounded-md ${building.status === 'active' ? 'bg-green-500/20 text-green-500' : 'bg-ds-surface-2 text-ds-fg-muted'}`}>
                      {building.status === 'active' ? '正常' : '停用'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEditBuildingModal(building)}
                        className="rounded p-1.5 text-ds-fg-muted transition-colors hover:bg-ds-surface-2 hover:text-ds-fg"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('确定删除该宿舍楼吗？')) {
                            deleteBuildingMutation.mutate(building.id);
                          }
                        }}
                        className="rounded p-1.5 text-ds-fg-muted transition-colors hover:bg-ds-danger/20 hover:text-ds-danger"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Rooms Tab */}
      {activeTab === 'rooms' && (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <select
              value={selectedBuilding}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedBuilding(e.target.value)}
              className="px-3 py-2 border border-ds-border rounded-md bg-ds-surface text-ds-fg text-sm"
            >
              <option value="all">全部楼栋</option>
              {buildings?.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div className="surface-card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-ds-border bg-ds-surface">
                  <th className="px-4 py-3 text-left text-sm font-medium text-ds-fg-muted">楼栋</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-ds-fg-muted">房间号</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-ds-fg-muted">楼层</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-ds-fg-muted">性别</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-ds-fg-muted">容量</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-ds-fg-muted">入住</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-ds-fg-muted">状态</th>
                  {isAdmin && <th className="px-4 py-3 text-right text-sm font-medium text-ds-fg-muted">操作</th>}
                </tr>
              </thead>
              <tbody>
                {rooms?.map((room) => (
                  <tr key={room.id} className="border-b border-ds-divider transition-colors hover:bg-ds-surface">
                    <td className="px-4 py-3 text-sm text-ds-fg-muted">{room.buildingName}</td>
                    <td className="px-4 py-3 text-sm font-medium text-ds-fg">{room.roomNo}</td>
                    <td className="px-4 py-3 text-sm text-ds-fg-muted">{room.floor}层</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 text-xs rounded-md ${room.gender === 'male' ? 'bg-blue-500/20 text-blue-500' : 'bg-pink-500/20 text-pink-500'}`}>
                        {room.gender === 'male' ? '男' : '女'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-ds-fg-muted">{room.capacity}人</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={room.occupied >= room.capacity ? 'text-ds-danger' : 'text-ds-fg-muted'}>
                        {room.occupied}/{room.beds}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 text-xs rounded-md ${room.status === 'active' ? 'bg-green-500/20 text-green-500' : 'bg-ds-surface-2 text-ds-fg-muted'}`}>
                        {room.status === 'active' ? '正常' : '停用'}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setEditingRoom(room);
                              setRoomForm({
                                buildingId: room.buildingId,
                                roomNo: room.roomNo,
                                floor: room.floor,
                                capacity: room.capacity,
                                beds: room.beds,
                                gender: room.gender,
                                remark: room.remark || '',
                              });
                              setShowRoomModal(true);
                            }}
                            className="rounded p-1.5 text-ds-fg-muted transition-colors hover:bg-ds-primary/20 hover:text-ds-primary"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('确定删除该房间吗？')) {
                                deleteRoomMutation.mutate(room.id);
                              }
                            }}
                            className="rounded p-1.5 text-ds-fg-muted transition-colors hover:bg-ds-danger/20 hover:text-ds-danger"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Building Modal */}
      {showBuildingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ds-overlay/50 backdrop-blur-sm">
          <div className="w-full max-w-md glass-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-ds-fg">
                {editingBuilding ? '编辑宿舍楼' : '添加宿舍楼'}
              </h2>
              <button onClick={() => setShowBuildingModal(false)} className="text-ds-fg-muted transition-colors hover:text-ds-fg">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm text-ds-fg-muted">楼名</label>
                <input
                  type="text"
                  value={buildingForm.name}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setBuildingForm({ ...buildingForm, name: e.target.value })}
                  placeholder="如：1号楼"
                  className="w-full rounded-md border border-ds-border bg-ds-surface px-4 py-2.5 text-ds-fg outline-none transition-colors placeholder:text-ds-fg-subtle focus:border-ds-primary focus:ring-2 focus:ring-ds-primary/20"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-ds-fg-muted">楼层数</label>
                <input
                  type="number"
                  value={buildingForm.floors}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setBuildingForm({ ...buildingForm, floors: parseInt(e.target.value) })}
                  min={1}
                  className="w-full rounded-md border border-ds-border bg-ds-surface px-4 py-2.5 text-ds-fg outline-none transition-colors placeholder:text-ds-fg-subtle focus:border-ds-primary focus:ring-2 focus:ring-ds-primary/20"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-ds-fg-muted">备注</label>
                <input
                  type="text"
                  value={buildingForm.remark}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setBuildingForm({ ...buildingForm, remark: e.target.value })}
                  placeholder="可选"
                  className="w-full rounded-md border border-ds-border bg-ds-surface px-4 py-2.5 text-ds-fg outline-none transition-colors placeholder:text-ds-fg-subtle focus:border-ds-primary focus:ring-2 focus:ring-ds-primary/20"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBuildingModal(false)}
                  className="flex-1 rounded-md border border-ds-border bg-ds-surface px-4 py-2 text-sm font-medium text-ds-fg transition-colors hover:bg-ds-surface-2"
                >
                  取消
                </button>
                <button
                  onClick={handleSaveBuilding}
                  className="flex-1 rounded-md bg-ds-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-ds-primary/90"
                >
                  {editingBuilding ? '保存' : '创建'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Room Modal */}
      {showRoomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ds-overlay/50 backdrop-blur-sm">
          <div className="w-full max-w-md glass-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-ds-fg">{editingRoom ? '编辑宿舍房间' : '添加宿舍房间'}</h2>
              <button onClick={() => { setShowRoomModal(false); setEditingRoom(null); }} className="text-ds-fg-muted transition-colors hover:text-ds-fg">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm text-ds-fg-muted">所属楼栋</label>
                <select
                  value={roomForm.buildingId}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) => setRoomForm({ ...roomForm, buildingId: e.target.value })}
                  disabled={!!editingRoom}
                  className="w-full rounded-md border border-ds-border bg-ds-surface px-4 py-2.5 text-ds-fg outline-none transition-colors focus:border-ds-primary focus:ring-2 focus:ring-ds-primary/20 disabled:opacity-50"
                >
                  <option value="">请选择楼栋</option>
                  {buildings?.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-ds-fg-muted">房间号</label>
                <input
                  type="text"
                  value={roomForm.roomNo}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setRoomForm({ ...roomForm, roomNo: e.target.value })}
                  placeholder="如：101"
                  className="w-full rounded-md border border-ds-border bg-ds-surface px-4 py-2.5 text-ds-fg outline-none transition-colors placeholder:text-ds-fg-subtle focus:border-ds-primary focus:ring-2 focus:ring-ds-primary/20"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-ds-fg-muted">楼层</label>
                <input
                  type="number"
                  value={roomForm.floor}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setRoomForm({ ...roomForm, floor: parseInt(e.target.value) })}
                  min={1}
                  className="w-full rounded-md border border-ds-border bg-ds-surface px-4 py-2.5 text-ds-fg outline-none transition-colors placeholder:text-ds-fg-subtle focus:border-ds-primary focus:ring-2 focus:ring-ds-primary/20"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm text-ds-fg-muted">容量</label>
                  <input
                    type="number"
                    value={roomForm.capacity}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setRoomForm({ ...roomForm, capacity: parseInt(e.target.value) })}
                    min={1}
                    className="w-full rounded-md border border-ds-border bg-ds-surface px-4 py-2.5 text-ds-fg outline-none transition-colors placeholder:text-ds-fg-subtle focus:border-ds-primary focus:ring-2 focus:ring-ds-primary/20"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm text-ds-fg-muted">床位数</label>
                  <input
                    type="number"
                    value={roomForm.beds}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setRoomForm({ ...roomForm, beds: parseInt(e.target.value) })}
                    disabled={!!editingRoom}
                    min={1}
                    className="w-full rounded-md border border-ds-border bg-ds-surface px-4 py-2.5 text-ds-fg outline-none transition-colors placeholder:text-ds-fg-subtle focus:border-ds-primary focus:ring-2 focus:ring-ds-primary/20 disabled:opacity-50"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-ds-fg-muted">性别</label>
                <select
                  value={roomForm.gender}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) => setRoomForm({ ...roomForm, gender: e.target.value })}
                  className="w-full rounded-md border border-ds-border bg-ds-surface px-4 py-2.5 text-ds-fg outline-none transition-colors focus:border-ds-primary focus:ring-2 focus:ring-ds-primary/20"
                >
                  <option value="male">男生</option>
                  <option value="female">女生</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-ds-fg-muted">备注</label>
                <input
                  type="text"
                  value={roomForm.remark}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setRoomForm({ ...roomForm, remark: e.target.value })}
                  placeholder="可选"
                  className="w-full rounded-md border border-ds-border bg-ds-surface px-4 py-2.5 text-ds-fg outline-none transition-colors placeholder:text-ds-fg-subtle focus:border-ds-primary focus:ring-2 focus:ring-ds-primary/20"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => { setShowRoomModal(false); setEditingRoom(null); }}
                  className="flex-1 rounded-md border border-ds-border bg-ds-surface px-4 py-2 text-sm font-medium text-ds-fg transition-colors hover:bg-ds-surface-2"
                >
                  取消
                </button>
                <button
                  onClick={handleSaveRoom}
                  className="flex-1 rounded-md bg-ds-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-ds-primary/90"
                >
                  {editingRoom ? '保存' : '创建'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ds-overlay/50 backdrop-blur-sm">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto glass-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-ds-fg">批量导入宿舍楼</h2>
              <button onClick={() => setShowImportModal(false)} className="text-ds-fg-muted transition-colors hover:text-ds-fg">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-ds-fg">步骤1: 下载模板并填写数据</h3>
                  <button
                    onClick={downloadTemplate}
                    className="flex items-center gap-1 text-sm text-ds-primary hover:underline"
                  >
                    <Download className="h-4 w-4" />
                    下载CSV模板
                  </button>
                </div>
                <div className="bg-ds-surface rounded-md p-3 text-xs text-ds-fg-muted">
                  <p className="font-medium mb-1 text-ds-fg">模板格式说明：</p>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>第一行为表头：楼名,楼层数,备注</li>
                    <li>楼名：必填，如"1号楼"、"毓秀楼"</li>
                    <li>楼层数：选填，默认为1</li>
                    <li>备注：选填，如"男生宿舍"、"女生宿舍"</li>
                  </ul>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-ds-fg mb-3">步骤2: 上传CSV文件</h3>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-ds-border bg-ds-surface p-8 transition-colors hover:border-ds-primary hover:bg-ds-surface-2"
                >
                  <FileSpreadsheet className="mb-2 h-10 w-10 text-ds-fg-muted" />
                  <p className="text-sm text-ds-fg-muted">
                    {importData.file ? importData.file.name : '点击上传或拖拽CSV文件到此处'}
                  </p>
                  <p className="mt-1 text-xs text-ds-fg-subtle">支持 .csv 格式</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              {importData.preview.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-ds-fg mb-3">数据预览（前5行）</h3>
                  <div className="surface-card overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-ds-border bg-ds-surface">
                          <th className="px-3 py-2 text-left text-xs font-medium text-ds-fg-muted">楼名</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-ds-fg-muted">楼层数</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-ds-fg-muted">备注</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-ds-fg-muted">状态</th>
                        </tr>
                      </thead>
                      <tbody>
                        {importData.preview.map((row, i) => (
                          <tr key={i} className="border-b border-ds-divider">
                            <td className="px-3 py-2 text-xs text-ds-fg">{row['楼名']}</td>
                            <td className="px-3 py-2 text-xs text-ds-fg-muted">{row['楼层数'] || '1'}</td>
                            <td className="px-3 py-2 text-xs text-ds-fg-muted">{row['备注'] || '-'}</td>
                            <td className="px-3 py-2">
                              {row['楼名'] ? (
                                <span className="flex items-center gap-1 text-xs text-green-500">
                                  <CheckCircle className="h-3 w-3" />
                                  校验通过
                                </span>
                              ) : (
                                <span className="text-xs text-ds-danger">楼名不能为空</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {importData.errors.length > 0 && (
                <div className="bg-ds-danger/10 border border-ds-danger/20 rounded-md p-4">
                  <h4 className="text-sm font-medium text-ds-danger mb-2">校验错误</h4>
                  <ul className="space-y-1 text-xs text-ds-danger">
                    {importData.errors.map((err, i) => (
                      <li key={i}>第{err.row}行: {err.message}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setShowImportModal(false)}
                  className="flex-1 rounded-md border border-ds-border bg-ds-surface px-4 py-2 text-sm font-medium text-ds-fg transition-colors hover:bg-ds-surface-2"
                >
                  取消
                </button>
                <button
                  onClick={handleImport}
                  disabled={!importData.file || importBuildingsMutation.isPending}
                  className="flex-1 rounded-md bg-ds-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-ds-primary/90 disabled:opacity-50"
                >
                  {importBuildingsMutation.isPending ? '导入中...' : '开始导入'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
