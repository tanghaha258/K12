# K12 教务管理系统 - 页面字段级说明（可直接开发）

说明：本文件把 PRD 的“页面/菜单”细化为字段、按钮、校验、权限点与接口映射。默认以“行政班”为组织单位，不包含家长端，不包含教学班。

## 0. 通用约定
### 0.1 主键与重名
- 学生唯一键：学号（studentNo）。姓名可重复。
- 所有涉及学生选择/列表：默认展示 `姓名 + 学号 + 班级`，并支持按学号精确搜索。
- URL 路由与接口：以学号/内部ID定位学生，不使用姓名作为关键条件。

### 0.2 权限三层
- 菜单权限：控制左侧菜单与路由可见。
- 功能权限：控制按钮/操作可用。
- 数据范围：控制查询与写入范围（年级/行政班/学科/本人）。

### 0.3 审计强制
- 成绩导入/提交/回滚/更正、德育事件撤销/更正、学生可变档案修改、权限变更、菜单/对象发布均需审计记录。

---

## 1. 登录与我的（PC/H5通用）
### 1.1 登录页
- 入口：未登录访问任意页面跳转
- 字段：
  - 账号（account）：必填；支持学号/工号
  - 密码（password）：必填
  - 图形验证码（captcha）：可选开关；开启后必填
- 按钮：
  - 登录（AUTH_LOGIN）
  - 忘记密码（可选：走管理员重置流程）
- 校验：
  - 账号/密码非空
  - 若 captcha 开启：captcha 非空
- 接口：
  - `POST /auth/login`
  - `GET /me`（登录成功后拉取菜单与权限）
- 状态与提示：
  - 登录失败：提示“账号或密码错误/账号已停用”
  - 首次登录：跳转“修改密码”

### 1.2 我的（账号设置）
- 入口：右上角用户菜单
- 字段：
  - 当前账号、姓名、角色列表（只读）
  - 修改密码：旧密码、新密码、确认新密码
- 按钮：
  - 保存密码（ME_PASSWORD_UPDATE）
- 校验：
  - 新密码长度与复杂度（规则可配置）
  - 新密码与确认一致
- 接口：
  - `PATCH /me/password`

---

## 2. 管理端（PC Web）

### 2.1 工作台
- 入口：菜单“工作台”
- 卡片：
  - 待办审批数量（可选）
  - 最近导入任务（用户导入、成绩导入、德育导入）
  - 异常预警摘要（临界生数量、德育预警数量）
- 接口：
  - `GET /dashboard/admin`

### 2.2 组织与人员

#### 2.2.1 年级管理（ORG_GRADE_MANAGE）
- 列表列：
  - 年级名称（如 2024级）、入学年份、当前学年学期、状态（在读/毕业）
- 操作：
  - 新增/编辑/停用
- 接口：`GET/POST/PATCH /org/grades`

#### 2.2.2 班级管理（ORG_CLASS_MANAGE）
- 过滤：
  - 年级（按权限可选）
  - 学年学期（默认当前）
- 列表列：
  - 班级名称（高一(3)班）
  - 年级
  - 班主任（可为空）
  - 学生数（实时/缓存）
- 操作：
  - 新增/编辑
  - 分配班主任（CLASS_ASSIGN_HEADTEACHER）
  - 关联科任老师授课（CLASS_ASSIGN_SUBJECT_TEACHER，可选）
- 接口：`GET/POST/PATCH /org/classes`

#### 2.2.3 用户管理（USER_VIEW）
##### A. 用户列表
- 过滤：
  - 角色（学生/教师/管理员）
  - 年级/班级（学生）
  - 状态（启用/停用）
  - 搜索：学号/工号/姓名（姓名命中后必须展示学号区分）
- 列表列（学生）：
  - 姓名、学号、年级、班级、状态、上次登录时间
- 列表列（教师）：
  - 姓名、工号、任教学科（可选）、状态
- 操作：
  - 启用/停用（USER_STATUS_UPDATE）
  - 重置密码（USER_PASSWORD_RESET）
  - 查看审计摘要（AUDIT_VIEW，选配）
- 接口：
  - `GET /users`
  - `PATCH /users/{id}/status`
  - `POST /users/batch/password-reset`

##### B. 批量导入学生账号（USER_IMPORT_STUDENT）
- 页面区域：
  - 下载模板（含字段说明）
  - 上传Excel
  - 预校验结果（错误行表格 + 可下载错误报告）
  - 导入任务进度
  - 成功后导出账号清单（学号、初始密码策略提示）
- Excel必需列（最小可用）：
  - 学号、姓名、性别、入学年份、当前年级、当前班级
- Excel可选列：
  - 宿舍楼栋/房间/床位、座位号、走读/住校、身份证号（可脱敏存储）
- 预校验规则：
  - 学号为空/重复：错误
  - 班级不存在：错误或自动创建（开关）
  - 性别非法：错误
  - 同名：允许
- 接口：
  - `POST /users/import`（type=STUDENT）
  - `GET /users/import/{taskId}`

---

### 2.3 角色权限（RBAC）
#### 2.3.1 角色管理（ROLE_MANAGE）
- 列表列：角色名、描述、创建时间、状态
- 操作：新增、复制、编辑、停用
- 接口：`GET/POST/PATCH /rbac/roles`

#### 2.3.2 菜单/功能权限配置（ROLE_PERMISSION_CONFIG）
- 结构：左侧树（菜单/页面），右侧勾选功能点（按钮）
- 操作：
  - 勾选菜单可见
  - 勾选页面内功能点
  - 保存并生效
- 接口：`POST /rbac/roles/{id}/permissions`

#### 2.3.3 数据范围授权（USER_SCOPE_CONFIG）
- 页面：用户详情 - 数据范围
- 可选范围：
  - 年级（多选）
  - 行政班（多选）
  - 学科（多选，供科任老师）
- 接口：`POST /rbac/users/{id}/scopes`、`GET /rbac/users/{id}/scopes`

---

### 2.4 考务中心（Exam & Score）
#### 2.4.1 考试管理（EXAM_CENTER_VIEW）
- 列表过滤：学年学期、年级、考试类型
- 列表列：考试名称、类型、年级、状态（草稿/已发布/已归档）
- 操作：
  - 新增考试（EXAM_CREATE）
  - 配置科目与满分（EXAM_SUBJECT_CONFIG）
  - 发布/归档（EXAM_PUBLISH）
- 接口：
  - `GET/POST/PATCH /exams`
  - `POST /exams/{id}/subjects`

#### 2.4.2 成绩导入与校验（SCORE_IMPORT_VIEW）
- 上传Excel必需列：
  - 学号、姓名（用于人工对照，不作为主键）、班级（可选）、各科分数列
- 预校验展示：
  - 学号不存在
  - 科目列缺失/多余
  - 分数超满分/非数字
  - 同一学号重复行
  - 缺考标记（支持空值或“缺考”）
- 操作：
  - 上传并预校验（SCORE_IMPORT_UPLOAD）
  - 确认入库（SCORE_IMPORT_COMMIT）
  - 回滚导入（SCORE_IMPORT_ROLLBACK，强审计）
- 接口：
  - `POST /scores/import`
  - `GET /scores/import/{taskId}`
  - `POST /scores/import/{taskId}/commit`
  - `POST /scores/import/{taskId}/rollback`
  - `POST /analytics/jobs/exam/{examId}`

---

### 2.5 德育量化
#### 2.5.1 德育事件列表（MORAL_VIEW）
- 过滤：
  - 时间范围（默认本周）
  - 来源（巡堂/纪检/宿舍/课堂）
  - 年级/班级（按权限）
  - 搜索：姓名/学号
- 列表列：
  - 时间、学生（姓名+学号+班级）、来源、项目、分值（+/-）、录入人、状态（正常/已撤销/待复核）
- 操作：
  - 新增事件（MORAL_EVENT_CREATE）
  - 批量导入（MORAL_EVENT_IMPORT）
  - 撤销/更正（MORAL_EVENT_REVOKE，强审计）
  - 复核（MORAL_EVENT_REVIEW，可选）
- 接口：
  - `GET /moral/events`
  - `POST /moral/events`
  - `POST /moral/events/import`
  - `POST /moral/events/{id}/revoke`
  - `POST /moral/events/{id}/review`

#### 2.5.2 德育统计（MORAL_STATS_VIEW）
- 页面模块：
  - 班级榜单（扣分Top）
  - 学生榜单
  - 来源对账
- 接口：
  - `GET /moral/stats/classes`
  - `GET /moral/stats/students`
  - `GET /moral/stats/sources`

---

### 2.6 功能配置（平台化能力）
#### 2.6.1 菜单与页面配置（MENU_CONFIG）
- 目标：配置“管理端/教师端/学生端”菜单树与页面路由。
- 字段：
  - 端类型（ADMIN/TEACHER/STUDENT）
  - 菜单名称、图标、排序、父级菜单
  - 路由（path）
  - 页面类型：内置页面 / 通用CRUD页面 / 外链
  - 绑定权限点（菜单权限code）
- 操作：新增/编辑/拖拽排序/发布
- 接口：`GET/POST/PATCH /ui/menus`

#### 2.6.2 通用CRUD对象管理（ENTITY_CONFIG）
- 字段：
  - 对象名称、对象编码（entityCode）
  - 字段定义：字段名、类型、必填、默认值、唯一性、字典绑定
  - 列表配置：显示列、排序、过滤条件
  - 表单配置：布局、校验规则
- 操作：
  - 新建对象
  - 发布对象（使其可被菜单引用）
  - 配置对象数据范围规则（读/写）
- 接口：
  - `GET/POST/PATCH /meta/entities`
  - `POST /meta/entities/{id}/publish`
  - `GET/POST/PATCH/DELETE /meta/entities/{id}/records`

---

## 3. 教师端（PC Web）

### 3.1 工作台
- 模块：
  - 我管理的班级（行政班）
  - 待审批
  - 临界生/德育预警摘要
- 接口：`GET /dashboard/teacher`

### 3.2 班主任 - 班级管理
- 列表列（学生）：
  - 姓名、学号、座位号、宿舍（楼栋-房间-床位）、走读/住校、状态
- 操作：
  - 编辑可变信息（STUDENT_PROFILE_EDIT）
- 编辑弹窗字段：
  - 座位号（可空）
  - 走读/住校（枚举）
  - 宿舍楼栋/房间/床位（可空）
  - 生效学期（默认当前学期，可选）
- 校验：
  - 床位号与房间号格式校验（规则可配置）
- 接口：
  - `GET /classes/{id}/students`
  - `PATCH /students/{id}/profile`

### 3.3 班主任 - 学生档案360
#### 页面结构（字段级）
- 吸顶信息条（Sticky）：
  - 姓名、学号（可复制）、当前行政班
  - 标签：临界生/偏科/重点关注/住校/走读（按规则生成或手动标记，增强项）
  - 操作：导出成绩单、查看审计（增强项）
- 左栏信息卡（当前学期快照）：
  - 不可变信息：姓名、学号、性别、入学年份
  - 可变信息：行政班、座位号、宿舍楼栋/房间/床位、走读/住校
  - 摘要指标：最近一次考试总分（或名次）、本周德育扣分合计（增强项）
  - 快捷：编辑可变信息（若有权限）
- 右栏 Tabs：成绩 / 德育 / 档案 / 备注（备注为可选增强）

#### 成绩 Tab（字段/表格）
- 过滤器：学期选择、视图（按考试/按学期）
- 趋势图数据点字段：
  - examId、examName、date、totalScore（可选）、classRank（可选）、gradeRank（可选）
- 单次成绩表字段：
  - subjectName、scoreValue、classRank、gradeRank、isAbsent

#### 德育 Tab（字段/时间轴）
- 过滤器：时间范围、来源多选（巡堂/纪检/宿舍/课堂）
- 时间轴字段：
  - eventId、occurredAt、source、itemName、scoreDelta、note、createdByName、status

#### 档案 Tab（字段/快照）
- 过滤器：学期选择
- 快照表字段：
  - term、className、seatNo、dormBuilding、dormRoom、dormBed、boardingType、updatedByName、updatedAt

#### 权限点（建议落库）
- 菜单：`STUDENT_360_VIEW`
- 功能：
  - 编辑可变信息：`STUDENT_PROFILE_EDIT`
  - 导出成绩单：`STUDENT_TRANSCRIPT_EXPORT`（可选）
  - 查看审计：`AUDIT_VIEW`（可选）

#### 接口（数据接入点）
- 基本信息：`GET /students/{id}`
- 档案快照：`GET /students/{id}/profiles`
- 成绩数据：`GET /students/{id}/scores`（支持 term/exam 过滤）
- 德育事件：`GET /students/{id}/moral-events`（支持时间范围与来源过滤）
- 编辑可变信息：`PATCH /students/{id}/profile`

### 3.4 班主任 - 班级分析
- 过滤：考试批次、科目（全科）
- 指标卡：
  - 平均分、优秀人数/率、及格人数/率、低分人数/率
- 图表：
  - 分段构成（柱/堆叠）
  - 学科对比（多科雷达/柱状）
- 列表：
  - 临界生列表（姓名+学号+当前分/线位差）
- 接口：
  - `GET /analytics/class`
  - `GET /analytics/class/segments`
  - `GET /analytics/class/borderline`

### 3.5 科任老师 - 成绩分析（任教学科）
- 过滤：考试批次、行政班（仅被授权的班级）
- 指标：均分、优秀率、及格率、低分率、分段构成
- 接口：
  - `GET /analytics/subject/classes`
  - `GET /analytics/subject/segments`

### 3.6 教师端 - 通知发布
- 字段：
  - 标题、正文、接收班级（多选）、附件（可选）、是否回执（可选）
- 接口：
  - `POST /notices`
  - `GET /notices`

---

## 4. 学生端（H5/小程序）
### 4.1 首页
- 模块：公告通知、待填报表单、成绩发布提醒、德育预警提醒
- 接口：`GET /home/feed`

### 4.2 成绩
- 模块：单次成绩单、学期趋势、学科强弱（雷达/排名）
- 接口：
  - `GET /me/scores`
  - `GET /me/analytics/subject-balance`

### 4.3 德育
- 模块：量化明细、时间轴、累计分
- 接口：
  - `GET /me/moral-events`
  - `GET /me/moral-summary`

### 4.4 填报（低代码表单）
- 模块：可填写表单列表、表单填写、提交成功回执、历史记录
- 接口：
  - `GET /lowcode/forms/available`
  - `GET /lowcode/forms/{id}`
  - `POST /lowcode/forms/{id}/submit`

### 4.5 我的
- 模块：档案摘要、修改密码
- 接口：
  - `GET /me`
  - `PATCH /me/password`
