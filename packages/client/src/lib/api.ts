import axios from 'axios';
import { useAuthStore } from '@/stores/authStore';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
}, (error) => Promise.reject(error));

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message || '未知错误';

    // 统一错误处理
    switch (status) {
      case 401:
        useAuthStore.getState().logout();
        window.location.href = '/login';
        break;
      case 403:
        console.error('权限不足:', message);
        break;
      case 404:
        console.error('资源不存在:', message);
        break;
      case 422:
        console.error('数据验证失败:', message);
        break;
      case 500:
        console.error('服务器错误:', message);
        break;
      default:
        console.error('请求错误:', message);
    }

    return Promise.reject(error);
  }
);

export default api;

export const authApi = {
  login: (account: string, password: string) => api.post('/auth/login', { account, password }),
  getMe: () => api.get('/me'),
  logout: () => api.post('/auth/logout'),
};

export const gradesApi = {
  list: (params?: { status?: string }) => api.get('/org/grades', { params }),
  get: (id: string) => api.get(`/org/grades/${id}`),
  create: (data: { name: string; entryYear: number }) => api.post('/org/grades', data),
  update: (id: string, data: { name?: string; entryYear?: number; status?: string }) => api.patch(`/org/grades/${id}`, data),
  delete: (id: string) => api.delete(`/org/grades/${id}`),
};

export const classesApi = {
  list: (params?: { gradeId?: string }) => api.get('/org/classes', { params }),
  get: (id: string) => api.get(`/org/classes/${id}`),
  create: (data: { name: string; gradeId: string }) => api.post('/org/classes', data),
  update: (id: string, data: { name?: string; headTeacherId?: string }) => api.patch(`/org/classes/${id}`, data),
  delete: (id: string) => api.delete(`/org/classes/${id}`),
  assignTeachers: (id: string, teachers: { teacherId: string; subjectId: string }[]) => api.post(`/org/classes/${id}/teachers`, { teachers }),
};

export const studentsApi = {
  list: (params?: { gradeId?: string; classId?: string; search?: string }) => api.get('/students', { params }),
  get: (id: string) => api.get(`/students/${id}`),
  create: (data: any) => api.post('/students', data),
  update: (id: string, data: any) => api.patch(`/students/${id}`, data),
  updateProfile: (id: string, data: any) => api.patch(`/students/${id}/profile`, data),
  delete: (id: string) => api.delete(`/students/${id}`),
};

export const teachersApi = {
  list: (params?: { search?: string }) => api.get('/teachers', { params }),
  get: (id: string) => api.get(`/teachers/${id}`),
  create: (data: { teacherNo: string; name: string }) => api.post('/teachers', data),
  update: (id: string, data: { name?: string }) => api.patch(`/teachers/${id}`, data),
  delete: (id: string) => api.delete(`/teachers/${id}`),
  assignClass: (id: string, data: { classId: string; subjectId: string }) => api.post(`/teachers/${id}/classes`, data),
  removeClass: (id: string, classId: string, subjectId: string) => api.delete(`/teachers/${id}/classes/${classId}/subjects/${subjectId}`),
  setAsHeadTeacher: (id: string, classId: string) => api.put(`/teachers/${id}/head-teacher/${classId}`),
};

export const subjectsApi = {
  list: () => api.get('/dict/subjects/all'),
  listByGrade: (gradeId: string) => api.get(`/dict/subjects/by-grade/${gradeId}`),
  create: (data: { code: string; name: string; gradeIds?: string[] }) => api.post('/dict/subjects', data),
  update: (id: string, data: { name?: string; code?: string; gradeIds?: string[] }) => api.patch(`/dict/subjects/${id}`, data),
  delete: (id: string) => api.delete(`/dict/subjects/${id}`),
};

// 分段规则API
export const scoreSegmentsApi = {
  list: (params?: { gradeId?: string; subjectId?: string; isActive?: boolean }) => api.get('/score-segments', { params }),
  get: (id: string) => api.get(`/score-segments/${id}`),
  create: (data: {
    name: string;
    gradeId: string;
    subjectId?: string;
    excellentMin?: number;
    goodMin?: number;
    passMin?: number;
    failMax?: number;
    isDefault?: boolean;
  }) => api.post('/score-segments', data),
  update: (id: string, data: Partial<{
    name: string;
    excellentMin: number;
    goodMin: number;
    passMin: number;
    failMax: number;
    isDefault: boolean;
    isActive: boolean;
  }>) => api.patch(`/score-segments/${id}`, data),
  delete: (id: string) => api.delete(`/score-segments/${id}`),
  getDefault: (gradeId: string, subjectId?: string) => api.get(`/score-segments/default/${gradeId}`, { params: { subjectId } }),
};

// 线位配置API
export const scoreLinesApi = {
  list: (params?: { gradeId?: string; type?: string; isActive?: boolean }) => api.get('/score-lines', { params }),
  get: (id: string) => api.get(`/score-lines/${id}`),
  create: (data: {
    name: string;
    type: 'ONE_BOOK' | 'REGULAR' | 'CUSTOM';
    gradeId: string;
    scoreValue: number;
    description?: string;
  }) => api.post('/score-lines', data),
  update: (id: string, data: Partial<{
    name: string;
    type: 'ONE_BOOK' | 'REGULAR' | 'CUSTOM';
    scoreValue: number;
    description: string;
    isActive: boolean;
  }>) => api.patch(`/score-lines/${id}`, data),
  delete: (id: string) => api.delete(`/score-lines/${id}`),
  getByGrade: (gradeId: string) => api.get(`/score-lines/grade/${gradeId}`),
  getByType: (gradeId: string, type: string) => api.get(`/score-lines/grade/${gradeId}/type/${type}`),
};

export const dormsApi = {
  listBuildings: () => api.get('/dorms/buildings'),
  listRooms: (buildingId?: string) => api.get('/dorms/rooms', { params: buildingId ? { buildingId } : undefined }),
  listBeds: (roomId?: string) => api.get('/dorms/beds', { params: roomId ? { roomId } : undefined }),
};

export const examsApi = {
  list: (params?: { gradeId?: string; type?: string; schoolYear?: string; status?: string }) =>
    api.get('/exams', { params }),
  get: (id: string) => api.get(`/exams/${id}`),
  getStatistics: (id: string) => api.get(`/exams/${id}/statistics`),
  create: (data: {
    name: string;
    type: string;
    term: string;
    schoolYear: string;
    gradeId: string;
    subjects?: { subjectId: string; maxScore: number; weight?: number; isStat?: boolean }[];
  }) => api.post('/exams', data),
  update: (id: string, data: Partial<{ name: string; type: string; term: string; schoolYear: string; status: string }>) =>
    api.patch(`/exams/${id}`, data),
  delete: (id: string) => api.delete(`/exams/${id}`),
  addSubject: (examId: string, data: { subjectId: string; maxScore: number; weight?: number; isStat?: boolean }) =>
    api.post(`/exams/${examId}/subjects`, data),
  removeSubject: (examId: string, subjectId: string) =>
    api.delete(`/exams/${examId}/subjects/${subjectId}`),
  publish: (id: string) => api.post(`/exams/${id}/publish`),
  unpublish: (id: string) => api.post(`/exams/${id}/unpublish`),
};

export const scoresApi = {
  list: (params?: { examId?: string; studentId?: string; subjectId?: string; classId?: string; gradeId?: string }) =>
    api.get('/scores', { params }),
  get: (id: string) => api.get(`/scores/${id}`),
  getAnalysis: (params: { examId: string; subjectId?: string; classId?: string }) =>
    api.get('/scores/analysis', { params }),
  create: (data: { studentId: string; examId: string; subjectId: string; rawScore: number; assignedScore?: number; isAbsent?: boolean }) =>
    api.post('/scores', data),
  batchCreate: (data: { examId: string; subjectId: string; scores: { studentId: string; rawScore: number; isAbsent?: boolean }[] }) =>
    api.post('/scores/batch', data),
  update: (id: string, data: Partial<{ rawScore: number; assignedScore: number; isAbsent: boolean }>) =>
    api.patch(`/scores/${id}`, data),
  delete: (id: string) => api.delete(`/scores/${id}`),
  calculateRanks: (examId: string, subjectId?: string) =>
    api.post(`/scores/ranks/${examId}`, null, { params: subjectId ? { subjectId } : undefined }),
};

export const analysisApi = {
  getStatistics: (params: { examId: string; subjectId?: string; classId?: string }) =>
    api.get('/analysis/statistics', { params }),
  getClassComparison: (params: { examId: string; subjectId?: string; classId?: string }) =>
    api.get('/analysis/class-comparison', { params }),
  getProgress: (params: { currentExamId: string; previousExamId: string; classId?: string }) =>
    api.get('/analysis/progress', { params }),
  getCriticalStudents: (params: { examId: string; lineType?: string; range?: number }) =>
    api.get('/analysis/critical-students', { params }),
  getSubjectBalance: (params: { examId: string; studentId?: string; classId?: string; threshold?: number }) =>
    api.get('/analysis/subject-balance', { params }),
  getRadarData: (params: { examId: string; subjectId?: string; classId?: string }) =>
    api.get('/analysis/radar', { params }),
};
