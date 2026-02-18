# K12 教务管理系统 - 接口清单（Data 接入点）

说明：本文件用于产品/研发对齐“页面需要哪些数据接入点”。字段可在技术设计阶段细化为 OpenAPI。

## 1. 鉴权与会话（Auth）
### 1.1 登录
- `POST /auth/login`
  - 用途：PC/H5 账号密码登录
  - 关键入参：account、password、clientType
  - 关键出参：accessToken、refreshToken、expiresIn
- `POST /auth/refresh`
  - 用途：刷新 token
- `POST /auth/logout`
  - 用途：退出登录
- `GET /me`
  - 用途：获取当前用户、角色、数据范围、菜单树
- `PATCH /me/password`
  - 用途：修改密码（首次登录强制可配置）

### 1.2 密码找回/重置
- `POST /auth/password/reset`（可选）
  - 用途：短信/邮箱重置
- `POST /users/batch/password-reset`
  - 用途：系统管理员批量重置

## 2. 组织与人员（Org & Users）
### 2.1 组织结构
- `GET/POST/PATCH /org/grades`
- `GET/POST/PATCH /org/classes`
- `POST /org/rollover`
  - 用途：学期升班/分班/毕业归档批处理

### 2.2 用户与档案
- `GET /users`
- `PATCH /users/{id}/status`
- `POST /users/import`
  - 用途：批量开通账号（学生为主；可选教师），异步任务
- `GET /users/import/{taskId}`
  - 用途：导入进度、错误行、可下载错误报告

### 2.3 学生档案（含历史）
- `GET /students`
  - 用途：列表与搜索（按数据范围）
- `GET /students/{id}`
  - 用途：学生基础信息（不可变）+ 当前状态（可变）
- `GET /students/{id}/profiles`
  - 用途：学期/学年档案快照（班级/宿舍/座位等）
- `PATCH /students/{id}/profile`
  - 用途：更新可变档案（受权限控制，班主任默认可直接修改）
- `GET /students/{id}/moral-events`
  - 用途：学生德育事件时间轴（支持来源与时间范围过滤）

## 3. 考务与成绩（Exam & Score）
### 3.1 考试管理
- `GET/POST/PATCH /exams`
- `POST /exams/{id}/subjects`
  - 用途：配置考试科目与满分/权重（可选）

### 3.2 成绩导入与入库
- `POST /scores/import`
  - 用途：上传成绩 Excel，异步解析与校验
- `GET /scores/import/{taskId}`
  - 用途：预校验结果（错误行/重复/缺考/科目列不匹配）
- `POST /scores/import/{taskId}/commit`
  - 用途：确认入库，写入 Score，并生成审计记录
- `POST /scores/import/{taskId}/rollback`
  - 用途：回滚本次导入（强审计，默认仅年级/系统管理员）

### 3.3 成绩查询（按角色数据范围返回）
- `GET /scores`
  - 用途：按 examId、classId、subjectId 拉取成绩明细（受限）
- `GET /me/scores`
  - 用途：学生端个人成绩

## 4. 分析与报表（Analytics & Reports）
### 4.1 班级/年级分析
- `GET /analytics/class`
  - 指标：均分、优秀/及格/低分人数与比例、最高/最低、标准差
- `GET /analytics/class/segments`
  - 指标：分段构成（按规则配置）
- `GET /analytics/class/borderline`
  - 指标：临界生列表（按线位配置）
- `GET /analytics/grade/classes`
  - 指标：年级内各班对比

### 4.2 学科分析（科任老师）
- `GET /analytics/subject/classes`
- `GET /analytics/subject/segments`
- `GET /me/analytics/subject-balance`

### 4.3 计算任务
- `POST /analytics/jobs/exam/{examId}`
  - 用途：触发排名与指标计算（导入后自动触发）
- `GET /analytics/jobs/{jobId}`

### 4.4 导出报表
- `GET /reports/exam/{examId}/class-compare`
- `GET /reports/exam/{examId}/borderline`
- `GET /reports/student/{studentId}/transcript`

## 5. 德育量化（Moral）
### 5.1 事件
- `GET /moral/events`
  - 过滤：studentId、classId、source、timeRange
- `POST /moral/events`
  - 用途：新增事件（巡堂/纪检/宿舍/课堂）
- `POST /moral/events/import`
  - 用途：批量导入事件
- `POST /moral/events/{id}/revoke`
  - 用途：撤销/更正（强审计）
- `POST /moral/events/{id}/review`
  - 用途：复核通过/驳回（可选流程）

### 5.2 统计
- `GET /moral/stats/classes`
- `GET /moral/stats/students`
- `GET /moral/stats/sources`
- `GET /me/moral-events`
- `GET /me/moral-summary`

## 6. 通知与消息（Notices）
- `GET /notices`
- `POST /notices`
- `GET /home/feed`

## 7. 低代码（Low-code）
### 7.1 表单
- `GET/POST/PATCH /lowcode/forms`
- `POST /lowcode/forms/{id}/publish`
- `GET /lowcode/forms/available`
- `GET /lowcode/forms/{id}`
- `POST /lowcode/forms/{id}/submit`
- `GET /lowcode/forms/{id}/records`

### 7.2 流程（可选增强）
- `GET/POST/PATCH /lowcode/workflows`
- `GET /approvals/inbox`
- `POST /approvals/{id}/action`

## 8. 分布屏（Display）
- `GET /display/stream`
  - 用途：返回滚动模块数据（德育榜单、临界生、预警等）与刷新策略

## 9. 平台化配置（UI & Meta）
### 9.1 菜单与页面配置
- `GET/POST/PATCH /ui/menus`
  - 用途：配置不同端的菜单树、路由、绑定权限点与页面类型

### 9.2 通用CRUD（对象管理）
- `GET/POST/PATCH /meta/entities`
  - 用途：定义业务对象（元数据）
- `POST /meta/entities/{id}/publish`
  - 用途：发布对象，使其可用于菜单与授权
- `GET/POST/PATCH/DELETE /meta/entities/{id}/records`
  - 用途：对象数据的通用增删改查（受RBAC与数据范围约束）

## 10. 审计（Audit）
- `GET /audit/logs`
  - 过滤：actor、type、timeRange、resourceId
