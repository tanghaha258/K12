# K12 教务管理系统 - API 契约

> 最后更新：2026-02-19

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
  name: string,        // 如 "2024级"
  entryYear: number,   // 入学年份
  status: 'active' | 'graduated'
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
  gender: string,
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
  gender: '男' | '女',
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

### DELETE /api/students/:id
删除学生

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
  subject_grades: [{
    grades: { id: string, name: string }
  }]
}]
```

### POST /api/dict/subjects
创建科目

**请求体：**
```typescript
{
  name: string,
  code: string,
  gradeIds?: string[]
}
```

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
  segments: { label: string, min: number, max: number }[],
  isDefault: boolean,
  isActive: boolean
}]
```

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
  type: 'excellent' | 'good' | 'pass' | 'custom',
  score: number,
  isActive: boolean
}]
```
