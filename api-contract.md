# K12 教务管理系统 - API 契约

> 最后更新：2026-02-20

## 服务地址

- **前端地址**: http://localhost:5173/
- **后端地址**: http://localhost:3000/
- **API 文档**: http://localhost:3000/api/docs

## 通用约定

### 响应格式
```typescript
// 成功响应
{
  data: T,
  message?: string
}

// 分页响应
{
  data: T[],
  total: number,
  page: number,
  pageSize: number
}

// 错误响应
{
  statusCode: number,
  message: string,
  error: string
}
```

### 认证
- 使用 JWT Bearer Token
- Header: `Authorization: Bearer <token>`

---

## 1. 认证模块

### POST /api/auth/login
登录获取 Token

**请求体：**
```typescript
{
  account: string,    // 学号/工号
  password: string
}
```

**响应：**
```typescript
{
  accessToken: string,
  user: {
    id: string,
    account: string,
    name: string,
    role: string
  }
}
```

### GET /api/auth/me
获取当前用户信息

**响应：**
```typescript
{
  id: string,
  account: string,
  name: string,
  role: string,
  roleName: string,
  student?: {
    studentNo: string,
    gradeId: string,
    classId: string,
    grade: { id: string, name: string },
    class: { id: string, name: string }
  },
  teacher?: {
    teacherNo: string
  }
}
```

---

## 2. 用户管理

### GET /api/users
获取用户列表（分页）

**查询参数：**
- `role`: 角色过滤
- `status`: 状态过滤
- `search`: 搜索（姓名/学号/工号）
- `page`: 页码
- `pageSize`: 每页数量

**响应：**
```typescript
{
  users: [{
    id: string,
    account: string,
    name: string,
    role: string,
    status: 'ACTIVE' | 'INACTIVE' | 'PENDING',
    roleName: string,
    student?: {
      studentNo: string,
      gradeId: string,
      classId: string,
      grade: { id: string, name: string },
      class: { id: string, name: string }
    },
    teacher?: {
      teacherNo: string
    },
    createdAt: Date
  }],
  total: number
}
```

### GET /api/users/:id
获取用户详情

**响应：**
```typescript
{
  id: string,
  account: string,
  name: string,
  role: string,
  status: string,
  roleName: string,
  student?: {
    studentNo: string,
    gradeId: string,
    classId: string,
    grade: { id: string, name: string },
    class: { id: string, name: string }
  },
  teacher?: {
    teacherNo: string,
    teacherClasses: [{
      class: { id: string, name: string, grade: { id: string, name: string } },
      subject: { id: string, name: string }
    }]
  },
  dataScopes: [{
    id: string,
    scopeType: 'GRADE' | 'CLASS' | 'SUBJECT',
    scopeId: string,
    grade?: { id: string, name: string },
    class?: { id: string, name: string },
    subject?: { id: string, name: string }
  }]
}
```

### PATCH /api/users/:id/status
更新用户状态

**请求体：**
```typescript
{
  status: 'ACTIVE' | 'INACTIVE'
}
```

### PATCH /api/users/:id/role
分配角色

**请求体：**
```typescript
{
  roleId: string
}
```

### POST /api/users/import
批量导入用户

**请求体：**
```typescript
{
  type: 'STUDENT' | 'TEACHER',
  users: [{
    name: string,
    studentNo?: string,  // 学生必填
    teacherNo?: string,  // 教师必填
    gender?: string,
    gradeId?: string,
    classId?: string
  }]
}
```

**响应：**
```typescript
{
  success: number,
  failed: number,
  errors: [{ row: number, message: string }]
}
```

### POST /api/users/batch/password-reset
批量重置密码

**请求体：**
```typescript
{
  userIds: string[]
}
```

**响应：**
```typescript
{
  success: true,
  count: number,
  defaultPassword: '123456'
}
```

---

## 3. 组织管理

### 年级 API

#### GET /api/org/grades
获取年级列表

**响应：**
```typescript
[{
  id: string,
  name: string,        // 如 "高一"
  entryYear: number,   // 入学年份
  status: 'active' | 'graduated',
  _count: {
    classes: number,
    students: number
  }
}]
```

#### POST /api/org/grades
创建年级

**请求体：**
```typescript
{
  name: string,
  entryYear: number
}
```

#### PATCH /api/org/grades/:id
更新年级

**请求体：**
```typescript
{
  name?: string,
  entryYear?: number,
  status?: string
}
```

#### DELETE /api/org/grades/:id
删除年级

### 班级 API

#### GET /api/org/classes
获取班级列表

**查询参数：**
- `gradeId`: 年级ID过滤

**响应：**
```typescript
[{
  id: string,
  name: string,
  gradeId: string,
  headTeacherId?: string,
  _count: {
    students: number
  }
}]
```

#### POST /api/org/classes
创建班级

**请求体：**
```typescript
{
  name: string,
  gradeId: string,
  headTeacherId?: string
}
```

#### PATCH /api/org/classes/:id
更新班级

#### DELETE /api/org/classes/:id
删除班级

---

## 4. 学生管理

### GET /api/students
获取学生列表

**查询参数：**
- `gradeId`: 年级过滤
- `classId`: 班级过滤
- `search`: 搜索（学号/姓名）

**响应：**
```typescript
[{
  id: string,
  studentNo: string,
  gender: string,  // 'male' | 'female'
  entryYear: number,
  gradeId: string,
  classId: string,
  seatNo?: string,
  boardingType: 'day' | 'boarding',
  user: {
    id: string,
    name: string,
    account: string,
    status: string
  },
  grade: { id: string, name: string },
  class: { id: string, name: string },
  dormBuilding?: string,
  dormRoom?: string,
  dormBed?: string
}]
```

### GET /api/students/:id
获取学生详情

### POST /api/students
创建学生

**请求体：**
```typescript
{
  studentNo: string,
  name: string,
  gender: 'male' | 'female',
  entryYear: number,
  gradeId: string,
  classId: string,
  idCard?: string,
  seatNo?: string,
  dormBuilding?: string,
  dormRoom?: string,
  dormBed?: string,
  boardingType?: 'day' | 'boarding'
}
```

### PATCH /api/students/:id
更新学生信息

### PATCH /api/students/:id/profile
更新学生档案信息

### DELETE /api/students/:id
删除学生

### POST /api/students/batch-import
批量导入学生

---

## 5. 教师管理

### GET /api/teachers
获取教师列表

**查询参数：**
- `search`: 搜索（工号/姓名）

**响应：**
```typescript
[{
  id: string,
  teacherNo: string,
  name: string,
  user: {
    id: string,
    name: string,
    account: string,
    status: string
  },
  classes: [{
    id: string,
    classId: string,
    className: string,
    gradeName: string,
    subjectId: string,
    subjectName: string
  }]
}]
```

### POST /api/teachers
创建教师

**请求体：**
```typescript
{
  teacherNo: string,
  name: string
}
```

### PUT /api/teachers/:id/head-teacher/:classId
设为班主任

---

## 6. 宿舍管理

### GET /api/dorms/buildings
获取宿舍楼列表

**响应：**
```typescript
[{
  id: string,
  name: string,
  floors: number,
  rooms?: number,
  beds?: number,
  remark?: string,
  status: string,
  roomCount: number
}]
```

### POST /api/dorms/buildings
创建宿舍楼

### PATCH /api/dorms/buildings/:id
更新宿舍楼

### DELETE /api/dorms/buildings/:id
删除宿舍楼

### GET /api/dorms/rooms
获取房间列表

**查询参数：**
- `buildingId`: 楼栋过滤

**响应：**
```typescript
[{
  id: string,
  buildingId: string,
  buildingName: string,
  roomNo: string,
  floor: number,
  capacity: number,
  beds: number,
  occupied: number,
  gender: 'male' | 'female',
  status: string
}]
```

### POST /api/dorms/rooms
创建房间（自动创建床位）

**请求体：**
```typescript
{
  buildingId: string,
  roomNo: string,
  floor: number,
  capacity: number,
  beds: number,
  gender: 'male' | 'female',
  remark?: string
}
```

### GET /api/dorms/beds
获取床位列表

**查询参数：**
- `roomId`: 房间ID过滤

### POST /api/dorms/beds
创建床位

### GET /api/dorms/statistics
获取宿舍统计

**响应：**
```typescript
{
  buildings: number,
  rooms: number,
  beds: number,
  occupied: number,
  empty: number,
  occupancyRate: number,
  boardingStudents: number
}
```

---

## 7. 角色权限

### GET /api/roles
获取角色列表

**响应：**
```typescript
[{
  id: string,
  name: string,
  code: string,
  description?: string,
  permissions: string[],
  isSystem: boolean
}]
```

### POST /api/roles
创建角色

**请求体：**
```typescript
{
  name: string,
  code: string,
  description?: string,
  permissions?: string[]
}
```

### POST /api/roles/:id/copy
复制角色

**请求体：**
```typescript
{
  name: string,
  code: string
}
```

### GET /api/roles/:id/permissions
获取角色权限

**响应：**
```typescript
{
  roleId: string,
  permissions: string[]
}
```

### POST /api/roles/:id/permissions
设置角色权限

**请求体：**
```typescript
{
  permissions: string[]
}
```

### GET /api/roles/menus
获取菜单权限列表

**响应：**
```typescript
[{
  id: string,
  name: string,
  permissions: string[]
}]
```

---

## 8. 数据权限

### GET /api/datascopes/user/:userId
获取用户数据范围

**响应：**
```typescript
{
  userId: string,
  scopes: [{
    id: string,
    scopeType: 'GRADE' | 'CLASS' | 'SUBJECT',
    scopeId: string
  }],
  grouped: {
    grades: [{ id: string, scopeType: string, scopeId: string }],
    classes: [{ id: string, scopeType: string, scopeId: string }],
    subjects: [{ id: string, scopeType: string, scopeId: string }]
  }
}
```

### POST /api/datascopes/user/:userId
设置用户数据范围

**请求体：**
```typescript
{
  scopes: [{
    scopeType: 'GRADE' | 'CLASS' | 'SUBJECT',
    scopeId: string
  }]
}
```

---

## 9. 字典管理

### GET /api/dict/subjects/all
获取所有科目

**响应：**
```typescript
[{
  id: string,
  name: string,
  code: string,
  maxScore: number,
  subject_grades: [{
    grades: { id: string, name: string }
  }]
}]
```

### GET /api/dict/subjects/by-grade/:gradeId
根据年级获取科目

### POST /api/dict/subjects
创建科目

**请求体：**
```typescript
{
  name: string,
  code: string,
  maxScore?: number,
  gradeIds?: string[]
}
```

### PATCH /api/dict/subjects/:id
更新科目

**请求体：**
```typescript
{
  name?: string,
  code?: string,
  maxScore?: number,
  gradeIds?: string[]
}
```

### DELETE /api/dict/subjects/:id
删除科目

---

## 10. 分段规则

### GET /api/score-segments
获取分段规则列表

**查询参数：**
- `gradeId`: 年级过滤
- `subjectId`: 科目过滤

**响应：**
```typescript
[{
  id: string,
  gradeId: string,
  subjectId?: string,
  name: string,
  excellentMin: number,
  goodMin: number,
  passMin: number,
  failMax: number,
  isDefault: boolean,
  isActive: boolean
}]
```

### POST /api/score-segments
创建分段规则

### PATCH /api/score-segments/:id
更新分段规则

### DELETE /api/score-segments/:id
删除分段规则

---

## 11. 线位配置

### GET /api/score-lines
获取线位列表

**响应：**
```typescript
[{
  id: string,
  gradeId: string,
  name: string,
  type: 'ONE_BOOK' | 'REGULAR' | 'CUSTOM',
  scoreValue: number,
  isActive: boolean
}]
```

### POST /api/score-lines
创建线位

### PATCH /api/score-lines/:id
更新线位

### DELETE /api/score-lines/:id
删除线位

---

## 12. 考试管理

### GET /api/exams
获取考试列表

**查询参数：**
- `gradeId`: 年级过滤
- `status`: 状态过滤

**响应：**
```typescript
[{
  id: string,
  name: string,
  type: string,
  term: string,
  schoolYear: string,
  gradeId: string,
  status: 'draft' | 'published',
  exam_subjects: [{
    id: string,
    subjectId: string,
    subjects: { id: string, name: string },
    maxScore: number,
    excellentLine?: number,
    passLine?: number,
    includeInTotal: boolean,
    includeInRank: boolean
  }]
}]
```

### POST /api/exams
创建考试

### PATCH /api/exams/:id
更新考试

### DELETE /api/exams/:id
删除考试

---

## 13. 成绩管理

### GET /api/scores
获取成绩列表

**查询参数：**
- `examId`: 考试ID
- `studentId`: 学生ID
- `subjectId`: 科目ID

### POST /api/scores
创建成绩

### POST /api/scores/batch
批量创建成绩

### POST /api/scores/import/:examId
导入成绩

### POST /api/scores/validate/:examId
验证成绩数据

### PATCH /api/scores/:id
更新成绩

### DELETE /api/scores/:id
删除成绩

### POST /api/scores/ranks/:examId
计算排名

### GET /api/scores/export/:examId
导出成绩

---

## 14. 成绩分析

### GET /api/analysis/statistics
获取基础统计

**查询参数：**
- `examId`: 考试ID（必填）
- `subjectId`: 科目ID（可选，不传则统计总分）
- `classId`: 班级ID（可选）

**响应：**
```typescript
{
  mode: 'subject' | 'total',
  exam: { id: string, name: string, gradeName: string },
  subject?: { id: string, name: string },
  total: number,
  absentCount: number,
  maxScore: number,
  scoreLines: {
    excellent: number,
    good: number,
    pass: number
  },
  statistics: {
    average: number,
    median: number,
    max: number,
    min: number,
    standardDeviation: number,
    excellentRate: number,
    passRate: number
  },
  segments: [{
    label: string,
    count: number,
    percentage: number,
    threshold: number
  }],
  excellentCount: number,
  goodCount: number,
  passCount: number,
  failCount: number,
  rankingList: [{
    rank: number,
    studentId: string,
    studentNo: string,
    name: string,
    className: string,
    score: number
  }]
}
```

### GET /api/analysis/class-comparison
班级对比分析

### GET /api/analysis/progress
进退步分析

### GET /api/analysis/critical-students
临界生分析

### GET /api/analysis/subject-balance
学科均衡分析

### GET /api/analysis/radar
雷达图分析

---

## 15. 德育量化

### GET /api/moral/rules
获取德育规则列表

### POST /api/moral/rules
创建德育规则

### GET /api/moral/events
获取德育事件列表

### POST /api/moral/events
创建德育事件

### GET /api/moral/stats/:studentId
获取学生德育统计

---

## 16. 系统设置

### GET /api/settings
获取系统设置

### PATCH /api/settings
更新系统设置

### GET /api/audit-logs
获取操作日志

**查询参数：**
- `page`: 页码
- `pageSize`: 每页数量
- `action`: 操作类型
- `startDate`: 开始日期
- `endDate`: 结束日期
