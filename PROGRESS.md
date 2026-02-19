# K12 教务管理系统 - 开发进度

> 最后更新：2026-02-19

## 项目状态概览

### 已完成模块 ✅

#### 1. 组织与人员管理
| 功能 | 状态 | 说明 |
|------|------|------|
| 年级管理 | ✅ | CRUD完整，支持状态管理 |
| 班级管理 | ✅ | CRUD完整，关联年级和班主任 |
| 学生管理 | ✅ | CRUD完整，批量导入导出，宿舍关联 |
| 教师管理 | ✅ | CRUD完整，授课班级管理 |
| 用户管理 | ✅ | 用户列表、详情、状态管理、角色分配 |

#### 2. 宿舍管理
| 功能 | 状态 | 说明 |
|------|------|------|
| 宿舍楼管理 | ✅ | CRUD完整 |
| 宿舍房间 | ✅ | 房间管理，性别限制 |
| 床位管理 | ✅ | 床位分配，学生入住/退宿 |
| 统计面板 | ✅ | 入住率统计 |

#### 3. 权限与角色
| 功能 | 状态 | 说明 |
|------|------|------|
| 角色管理 | ✅ | 6个系统内置角色，支持复制角色 |
| 权限配置 | ✅ | 菜单权限、功能权限配置 |
| 数据权限 | ✅ | 年级/班级/学科范围授权 |
| 学生数据范围 | ✅ | 学生默认只能看到自己年级和班级 |

#### 4. 字典与配置
| 功能 | 状态 | 说明 |
|------|------|------|
| 科目管理 | ✅ | 科目CRUD，关联年级 |
| 分段规则 | ✅ | 成绩分段配置 |
| 线位配置 | ✅ | 临界线配置 |

---

## 技术架构

### 后端技术栈
- **框架**: NestJS + TypeScript
- **数据库**: MySQL + Prisma ORM
- **认证**: JWT Token
- **API文档**: Swagger

### 前端技术栈
- **框架**: React + TypeScript
- **构建**: Vite
- **样式**: Tailwind CSS + Glassmorphism设计系统
- **组件**: Radix UI + Lucide Icons
- **状态管理**: Zustand
- **数据获取**: TanStack Query

### 数据库模型
```
users (用户表)
├── id, account, password, name, role, status, roleId
├── students (学生信息)
├── teachers (教师信息)
└── data_scopes (数据权限)

roles (角色表)
├── id, name, code, description, permissions, isSystem
└── permissions (JSON数组)

grades (年级表)
├── id, name, entryYear, status
└── classes (班级)

classes (班级表)
├── id, name, gradeId, headTeacherId
└── students (学生)

students (学生表)
├── id, userId, studentNo, gradeId, classId
├── dormRoomId, dormBedId, boardingType
└── seatNo, gender, idCard

teachers (教师表)
├── id, userId, teacherNo, name
└── teacher_classes (授课班级)

dorm_buildings (宿舍楼)
├── id, name, floors, rooms, beds
└── dorm_rooms (房间)

dorm_rooms (宿舍房间)
├── id, buildingId, roomNo, floor, capacity
├── gender, beds
└── dorm_beds (床位)

subjects (科目表)
├── id, name, code
└── subject_grades (适用年级)
```

---

## API 端点汇总

### 认证模块
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/auth/login | 登录 |
| GET | /api/auth/me | 获取当前用户信息 |

### 用户管理
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/users | 用户列表（分页） |
| GET | /api/users/:id | 用户详情 |
| POST | /api/users/import | 批量导入用户 |
| POST | /api/users/batch/password-reset | 批量重置密码 |
| PATCH | /api/users/:id/status | 更新用户状态 |
| PATCH | /api/users/:id/role | 分配角色 |

### 组织管理
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/org/grades | 年级列表 |
| POST | /api/org/grades | 创建年级 |
| PATCH | /api/org/grades/:id | 更新年级 |
| DELETE | /api/org/grades/:id | 删除年级 |
| GET | /api/org/classes | 班级列表 |
| POST | /api/org/classes | 创建班级 |
| PATCH | /api/org/classes/:id | 更新班级 |
| DELETE | /api/org/classes/:id | 删除班级 |

### 学生管理
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/students | 学生列表 |
| GET | /api/students/:id | 学生详情 |
| POST | /api/students | 创建学生 |
| PATCH | /api/students/:id | 更新学生 |
| DELETE | /api/students/:id | 删除学生 |
| POST | /api/students/import | 批量导入 |

### 教师管理
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/teachers | 教师列表 |
| GET | /api/teachers/:id | 教师详情 |
| POST | /api/teachers | 创建教师 |
| PATCH | /api/teachers/:id | 更新教师 |
| DELETE | /api/teachers/:id | 删除教师 |
| PUT | /api/teachers/:id/head-teacher/:classId | 设为班主任 |

### 宿舍管理
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/dorms/buildings | 宿舍楼列表 |
| POST | /api/dorms/buildings | 创建宿舍楼 |
| PATCH | /api/dorms/buildings/:id | 更新宿舍楼 |
| DELETE | /api/dorms/buildings/:id | 删除宿舍楼 |
| GET | /api/dorms/rooms | 房间列表 |
| POST | /api/dorms/rooms | 创建房间 |
| GET | /api/dorms/beds | 床位列表 |
| POST | /api/dorms/beds | 创建床位 |
| GET | /api/dorms/statistics | 宿舍统计 |

### 角色权限
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/roles | 角色列表 |
| GET | /api/roles/:id | 角色详情 |
| POST | /api/roles | 创建角色 |
| POST | /api/roles/:id/copy | 复制角色 |
| PATCH | /api/roles/:id | 更新角色 |
| DELETE | /api/roles/:id | 删除角色 |
| GET | /api/roles/:id/permissions | 获取角色权限 |
| POST | /api/roles/:id/permissions | 设置角色权限 |
| GET | /api/roles/menus | 获取菜单权限列表 |

### 数据权限
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/datascopes | 数据权限列表 |
| GET | /api/datascopes/teachers | 可选教师列表 |
| GET | /api/datascopes/my | 当前用户数据范围 |
| GET | /api/datascopes/user/:userId | 用户数据范围 |
| POST | /api/datascopes/user/:userId | 设置用户数据范围 |
| DELETE | /api/datascopes/:id | 删除数据权限 |

### 字典管理
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/dict/types | 字典类型列表 |
| GET | /api/dict/:type | 字典项 |
| GET | /api/dict/subjects/all | 科目列表 |
| POST | /api/dict/subjects | 创建科目 |
| PATCH | /api/dict/subjects/:id | 更新科目 |
| DELETE | /api/dict/subjects/:id | 删除科目 |

### 分段规则
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/score-segments | 分段规则列表 |
| POST | /api/score-segments | 创建分段规则 |
| GET | /api/score-segments/default/:gradeId | 获取默认分段规则 |

### 线位配置
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/score-lines | 线位列表 |
| POST | /api/score-lines | 创建线位 |
| GET | /api/score-lines/grade/:gradeId | 按年级获取线位 |

---

## 系统角色定义

| 角色代码 | 角色名称 | 说明 |
|----------|----------|------|
| ADMIN | 超级管理员 | 系统最高权限，拥有所有功能 |
| SCHOOL_ADMIN | 学校管理员 | 学校级管理，可管理所有年级 |
| GRADE_DIRECTOR | 年级主任 | 管理指定年级的班级和学生 |
| HEAD_TEACHER | 班主任 | 管理指定班级的学生 |
| SUBJECT_TEACHER | 科任老师 | 管理授课班级的成绩 |
| STUDENT | 学生 | 查看个人信息和成绩 |

---

## 待开发模块 📋

### 成绩中心
| 功能 | 优先级 | 说明 |
|------|--------|------|
| 考试管理 | 高 | 创建考试、设置科目 |
| 成绩导入 | 高 | Excel解析、异步导入 |
| 成绩查询 | 中 | 多维度查询 |
| 成绩分析 | 中 | 排名、分段统计 |

### 德育量化
| 功能 | 优先级 | 说明 |
|------|--------|------|
| 德育规则 | 中 | 分值规则配置 |
| 事件录入 | 中 | 德育事件记录 |
| 德育统计 | 中 | 班级/个人统计 |

---

## 开发环境

- **前端**: http://localhost:5173
- **后端**: http://localhost:3000
- **API文档**: http://localhost:3000/api/docs
- **数据库**: MySQL localhost:3306

---

## 开发规范

### 代码规范
- TypeScript 严格模式
- 函数式组件 + Hooks
- API 调用使用 React Query
- 样式使用 Tailwind CSS
- 图标使用 Lucide React

### 命名约定
- 数据库表名：snake_case (如 `dorm_buildings`)
- API路由：kebab-case (如 `/score-segments`)
- 前端组件：PascalCase (如 `DataScopes.tsx`)
- 变量/函数：camelCase

### Git 提交规范
```
feat: 新功能
fix: 修复bug
docs: 文档更新
style: 代码格式
refactor: 重构
test: 测试
chore: 构建/工具
```
