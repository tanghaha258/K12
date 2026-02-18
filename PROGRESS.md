# K12 教务管理系统 - 开发进度

> 最后更新：2026-02-18 23:15

## 阶段一：基础功能加固 ✅ (已完成)

### 1.1 回归测试报告
| 指标 | 数值 |
|------|------|
| 总测试项 | 27 |
| 通过 | 26 |
| 失败 | 1 (测试脚本问题，API实际正常) |
| **通过率** | **96.3%** |

### 1.2 修复的问题
| 问题 | 修复措施 | 状态 |
|------|----------|------|
| PATCH /org/grades/:id 404 | 将 @Put 改为 @Patch | ✅ |
| PATCH /org/classes/:id 404 | 将 @Put 改为 @Patch | ✅ |
| PATCH /teachers/:id 404 | 将 @Put 改为 @Patch | ✅ |
| PATCH /students/:id 404 | 将 @Put 改为 @Patch | ✅ |
| GET /datascopes 404 | 添加列表接口和教师列表接口 | ✅ |

### 1.3 修改的文件（后端）
- `grades.controller.ts` - PATCH 方法
- `classes.controller.ts` - PATCH 方法
- `teachers.controller.ts` - PATCH 方法
- `students.controller.ts` - PATCH 方法
- `datascope.controller.ts` - 添加列表接口和Swagger文档

### 1.4 前端API同步更新
- `api.ts` - 所有 update 方法从 PUT 改为 PATCH
- `api.ts` - 增强错误拦截器，统一错误提示

---

## 项目状态概览

## 项目状态概览

### 已完成模块 ✅

#### 4.2.1 组织与人员（基础模块）
| 功能 | 状态 | 说明 |
|------|------|------|
| 年级管理 | ✅ | 新增、编辑、删除年级，自动计算当前年级（高一/高二/高三） |
| 班级管理 | ✅ | 班级CRUD，关联年级，统计班级人数 |
| 学生管理 | ✅ | 学生CRUD，批量导入导出（CSV/Excel），关联班级 |
| 教师管理 | ✅ | 教师CRUD，批量导入导出，管理授课班级和科目 |

#### 4.2.2 宿舍管理
| 功能 | 状态 | 说明 |
|------|------|------|
| 宿舍楼管理 | ✅ | 楼栋CRUD，统计楼层/房间/床位 |
| 宿舍房间 | ✅ | 房间管理，性别限制，容量管理 |
| 批量导入 | ✅ | CSV模板下载，数据预览，批量导入宿舍楼 |
| 统计面板 | ✅ | 楼栋数、房间数、总床位、入住率 |

#### 4.2.3 权限与账号
| 功能 | 状态 | 说明 |
|------|------|------|
| 用户管理 | ✅ | 账号开通，批量导入学生/教师，重置密码，启用/停用 |
| 用户详情 | ✅ | 查看用户详细信息（基本信息、学生/教师信息、数据权限范围） |
| 角色权限 | ✅ | 新建角色、复制角色、配置菜单/按钮权限 |
| 数据权限 | ✅ | 按教师分配数据范围（年级/班级/学生） |
| 角色分配 | ✅ | 给用户分配角色（从Role表读取） |
| 系统角色 | ✅ | 6个系统内置角色（超级管理员、学校管理员、年级主任、班主任、科任老师、学生） |
| 学生数据范围 | ✅ | 学生默认数据范围为本班级，仅能看到自己年级和班级的数据 |

#### 4.2.4 字典与规则
| 功能 | 状态 | 说明 |
|------|------|------|
| 科目库 | ✅ | 科目CRUD，用于教师授课和成绩管理 |
| 系统字典 | ✅ | 性别、用户状态、考试类型、成绩等级等枚举值 |

---

## 技术实现细节

### 后端技术栈
- **框架**: NestJS + TypeScript
- **数据库**: MySQL + Prisma ORM
- **认证**: JWT Token
- **API文档**: Swagger

### 前端技术栈
- **框架**: React + TypeScript
- **构建**: Vite
- **样式**: Tailwind CSS
- **组件**: Radix UI + 自定义组件
- **状态管理**: Zustand
- **数据获取**: TanStack Query (React Query)

### 数据库模型
```
User (用户)
  - id, account, password, name, role, status, roleId
  - 关联: student, teacher, roleRef

Role (角色)
  - id, name, code, description, permissions (JSON)
  
DataScope (数据权限)
  - id, userId, scopeType, scopeId
  
Grade (年级)
  - id, name, entryYear, status

Class (班级)
  - id, name, gradeId, headTeacherId

Student (学生)
  - id, userId, studentNo, gradeId, classId

Teacher (教师)
  - id, userId, teacherNo

DormBuilding (宿舍楼)
  - id, name, floors, rooms, beds, status

DormRoom (宿舍房间)
  - id, buildingId, roomNo, floor, capacity, beds, gender

Subject (科目)
  - id, name, code
```

---

## UI/UX 规范

### 弹窗样式（统一规范）
所有弹窗必须使用统一的 glassmorphism 样式：
```html
<!-- 背景遮罩 -->
<div class="fixed inset-0 z-50 flex items-center justify-center bg-ds-overlay/50 backdrop-blur-sm">
  <!-- 弹窗内容 -->
  <div class="w-full max-w-md glass-card p-6">
    ...
  </div>
</div>
```

### 按钮样式
- 主要按钮: `bg-ds-primary text-white hover:bg-ds-primary/90`
- 次要按钮: `border border-ds-border bg-ds-surface hover:bg-ds-surface-2`
- 危险按钮: `text-ds-danger hover:bg-ds-danger/20`

### 表格样式
- 表头: `bg-ds-surface border-b border-ds-border`
- 行悬停: `hover:bg-ds-surface`
- 单元格: `px-4 py-3 text-sm`

---

## 待开发模块 📋

### 4.3 成绩中心（考务与成绩）
| 功能 | 优先级 | 说明 |
|------|--------|------|
| 考试管理 | 高 | 创建考试、设置科目、安排考场 |
| 成绩导入 | 高 | Excel解析、异步任务、进度显示 |
| 成绩查询 | 中 | 学生/教师/管理员不同视图 |
| 成绩分析 | 中 | 排名、分段统计、临界生分析 |
| 成绩单打印 | 低 | PDF导出、批量打印 |

### 4.4 德育量化
| 功能 | 优先级 | 说明 |
|------|--------|------|
| 德育规则 | 中 | 分值规则、预警阈值 |
| 事件录入 | 中 | 教师录入德育事件 |
| 德育统计 | 中 | 班级/个人德育分统计 |
| 预警通知 | 低 | 德育预警推送 |

### 4.5 低代码平台
| 功能 | 优先级 | 说明 |
|------|--------|------|
| 表单设计器 | 低 | 拖拽创建表单 |
| 流程设计器 | 低 | 审批流程配置 |
| 数据填报 | 低 | 临时性数据收集 |

---

## 已知问题与优化项

### 已修复 ✅
- [x] 弹窗样式统一为 glassmorphism
- [x] 后端500错误（Prisma客户端生成问题）
- [x] 角色分配从Role表获取

### 待优化 📝
- [ ] 前端代码分割（当前chunk超过500KB）
- [ ] 表格虚拟滚动（大数据量优化）
- [ ] 图片/文件上传功能
- [ ] 消息通知系统
- [ ] 操作日志审计

---

## 近期更新记录

### 2026-02-18 功能更新

#### 1. 系统角色体系完善
**功能描述：**
- 实现6个系统内置角色：超级管理员、学校管理员、年级主任、班主任、科任老师、学生
- 系统角色标记为"内置"，不可删除
- 角色权限与菜单权限绑定

**涉及文件：**
- `packages/server/src/modules/roles/roles.service.ts` - 系统角色初始化逻辑
- `packages/client/src/pages/Roles.tsx` - 角色管理页面显示"内置"标签

#### 2. 学生数据范围权限
**功能描述：**
- 学生默认数据范围为自己的班级
- 学生在数据权限页面仅能看到自己所属年级
- 学生在班级选项卡仅能看到自己年级下的班级
- 默认自动勾选学生的年级和班级
- 学生不显示学科选项卡

**涉及文件：**
- `packages/client/src/pages/DataScopes.tsx` - 数据权限页面学生特殊处理
- `packages/server/src/modules/students/students.service.ts` - 创建学生时自动创建数据范围

#### 3. 用户详情页
**功能描述：**
- 用户列表添加"查看详情"按钮
- 详情弹窗展示：
  - 基本信息（账号、姓名、角色、状态）
  - 学生信息（学号、年级、班级）
  - 教师信息（工号、任课班级和学科）
  - 数据权限范围（年级、班级、学科）
- 支持折叠展开各个信息区块
- 快捷操作：分配角色、启用/停用、重置密码

**涉及文件：**
- `packages/client/src/pages/Users.tsx` - 用户详情弹窗组件
- `packages/server/src/modules/users/users.controller.ts` - 新增用户详情API
- `packages/server/src/modules/users/users.service.ts` - 用户详情查询逻辑

**API变更：**
- 新增 `GET /api/users/:id` - 获取用户详情

---

---

## API 端点汇总

### 认证
- `POST /api/auth/login` - 登录
- `GET /api/auth/me` - 获取当前用户

### 用户管理
- `GET /api/users` - 用户列表
- `GET /api/users/:id` - 用户详情（包含学生/教师信息、数据权限范围）
- `POST /api/users/import` - 批量导入
- `POST /api/users/batch/password-reset` - 批量重置密码
- `PATCH /api/users/:id/status` - 更新状态
- `PATCH /api/users/:id/role` - 分配角色

### 组织管理
- `GET /api/org/grades` - 年级列表
- `POST /api/org/grades` - 创建年级
- `GET /api/org/classes` - 班级列表
- `POST /api/org/classes` - 创建班级

### 学生管理
- `GET /api/students` - 学生列表
- `POST /api/students` - 创建学生
- `POST /api/students/import` - 批量导入
- `GET /api/students/export` - 导出学生

### 教师管理
- `GET /api/teachers` - 教师列表
- `POST /api/teachers` - 创建教师
- `POST /api/teachers/import` - 批量导入

### 宿舍管理
- `GET /api/dorms/buildings` - 宿舍楼列表
- `POST /api/dorms/buildings` - 创建宿舍楼
- `POST /api/dorms/buildings/import` - 批量导入
- `GET /api/dorms/rooms` - 宿舍房间列表
- `GET /api/dorms/statistics` - 宿舍统计

### 角色权限
- `GET /api/roles` - 角色列表
- `POST /api/roles` - 创建角色
- `POST /api/roles/:id/copy` - 复制角色
- `POST /api/roles/:id/permissions` - 设置权限
- `GET /api/roles/menu/list` - 菜单列表

### 数据权限
- `GET /api/datascopes` - 数据权限列表
- `POST /api/datascopes` - 创建数据权限
- `GET /api/datascopes/teachers` - 可选教师列表

### 字典管理
- `GET /api/dict/types` - 字典类型
- `GET /api/dict/:type` - 字典项
- `GET /api/dict/subjects/all` - 科目列表
- `POST /api/dict/subjects` - 创建科目

---

## 开发规范

### Git 提交规范
```
feat: 新功能
fix: 修复bug
docs: 文档更新
style: 代码格式调整
refactor: 重构
test: 测试相关
chore: 构建/工具相关
```

### 代码规范
- 使用 TypeScript 严格模式
- 组件使用函数式组件 + Hooks
- API 调用使用 React Query
- 状态管理使用 Zustand
- 样式使用 Tailwind CSS
- 图标使用 Lucide React

---

## 部署信息

### 开发环境
- 前端: http://localhost:5173
- 后端: http://localhost:3000
- API文档: http://localhost:3000/api/docs
- 数据库: MySQL localhost:3306

### 生产环境
- 待配置

---

## 联系方式

- 项目负责人：待填写
- 技术负责人：待填写
- 产品负责人：待填写
