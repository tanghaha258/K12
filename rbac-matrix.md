# K12 教务管理系统 - RBAC 权限矩阵

> 最后更新：2026-02-19

## 系统角色定义

| 角色代码 | 角色名称 | 说明 | 数据范围 |
|----------|----------|------|----------|
| ADMIN | 超级管理员 | 系统最高权限 | 全部数据 |
| SCHOOL_ADMIN | 学校管理员 | 学校级管理 | 全部数据 |
| GRADE_DIRECTOR | 年级主任 | 管理指定年级 | 授权年级 |
| HEAD_TEACHER | 班主任 | 管理指定班级 | 授权班级 |
| SUBJECT_TEACHER | 科任老师 | 管理授课班级成绩 | 授权班级+学科 |
| STUDENT | 学生 | 查看个人信息 | 本人数据 |

---

## 菜单权限配置

### 菜单定义

| 菜单ID | 菜单名称 | 权限点 |
|--------|----------|--------|
| dashboard | 工作台 | view |
| grades | 年级管理 | view, create, edit, delete |
| classes | 班级管理 | view, create, edit, delete |
| students | 学生管理 | view, create, edit, delete, import, export |
| teachers | 教师管理 | view, create, edit, delete, import, export |
| dorms | 宿舍管理 | view, create, edit, delete, import, export |
| users | 用户管理 | view, create, edit, delete, import, reset-password |
| roles | 角色权限 | view, create, edit, delete |
| datascopes | 数据范围 | view, edit |
| subjects | 科目管理 | view, create, edit, delete |
| score-segments | 分段规则 | view, create, edit, delete |
| score-lines | 线位配置 | view, create, edit, delete |

### 角色菜单权限矩阵

| 菜单 | ADMIN | SCHOOL_ADMIN | GRADE_DIRECTOR | HEAD_TEACHER | SUBJECT_TEACHER | STUDENT |
|------|-------|--------------|----------------|--------------|-----------------|---------|
| 工作台 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 年级管理 | ✅ | ✅ | view | ❌ | ❌ | ❌ |
| 班级管理 | ✅ | ✅ | ✅ | view | ❌ | ❌ |
| 学生管理 | ✅ | ✅ | ✅ | ✅ | view | view(self) |
| 教师管理 | ✅ | ✅ | ✅ | view | ❌ | ❌ |
| 宿舍管理 | ✅ | ✅ | ✅ | view | ❌ | ❌ |
| 用户管理 | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| 角色权限 | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| 数据范围 | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| 科目管理 | ✅ | ✅ | view | view | view | ❌ |
| 分段规则 | ✅ | ✅ | ✅ | view | view | ❌ |
| 线位配置 | ✅ | ✅ | ✅ | view | view | ❌ |

---

## 功能权限配置

### 学生管理功能

| 功能点 | 代码 | ADMIN | SCHOOL_ADMIN | GRADE_DIRECTOR | HEAD_TEACHER |
|--------|------|-------|--------------|----------------|--------------|
| 查看学生 | students:view | ✅ | ✅ | ✅ | ✅ |
| 新增学生 | students:create | ✅ | ✅ | ✅ | ❌ |
| 编辑学生 | students:edit | ✅ | ✅ | ✅ | ✅ |
| 删除学生 | students:delete | ✅ | ✅ | ❌ | ❌ |
| 导入学生 | students:import | ✅ | ✅ | ❌ | ❌ |
| 导出学生 | students:export | ✅ | ✅ | ✅ | ✅ |

### 教师管理功能

| 功能点 | 代码 | ADMIN | SCHOOL_ADMIN |
|--------|------|-------|--------------|
| 查看教师 | teachers:view | ✅ | ✅ |
| 新增教师 | teachers:create | ✅ | ✅ |
| 编辑教师 | teachers:edit | ✅ | ✅ |
| 删除教师 | teachers:delete | ✅ | ✅ |
| 导入教师 | teachers:import | ✅ | ✅ |
| 设为班主任 | teachers:set-head | ✅ | ✅ |

### 用户管理功能

| 功能点 | 代码 | ADMIN | SCHOOL_ADMIN |
|--------|------|-------|--------------|
| 查看用户 | users:view | ✅ | ✅ |
| 启用/停用用户 | users:status | ✅ | ✅ |
| 重置密码 | users:reset-password | ✅ | ✅ |
| 分配角色 | users:assign-role | ✅ | ✅ |
| 批量导入 | users:import | ✅ | ✅ |

### 角色权限功能

| 功能点 | 代码 | ADMIN | SCHOOL_ADMIN |
|--------|------|-------|--------------|
| 查看角色 | roles:view | ✅ | ✅ |
| 新增角色 | roles:create | ✅ | ✅ |
| 编辑角色 | roles:edit | ✅ | ✅ |
| 删除角色 | roles:delete | ✅ | ❌ |
| 复制角色 | roles:copy | ✅ | ✅ |
| 配置权限 | roles:config-permissions | ✅ | ✅ |

---

## 数据范围规则

### 数据范围类型

| 类型 | 说明 | 适用角色 |
|------|------|----------|
| GRADE | 年级范围 | 年级主任 |
| CLASS | 班级范围 | 班主任、科任老师 |
| SUBJECT | 学科范围 | 科任老师 |

### 数据范围过滤规则

#### 学生数据
- **ADMIN/SCHOOL_ADMIN**: 可查看所有学生
- **GRADE_DIRECTOR**: 仅可查看授权年级的学生
- **HEAD_TEACHER**: 仅可查看授权班级的学生
- **SUBJECT_TEACHER**: 仅可查看授课班级的学生
- **STUDENT**: 仅可查看自己的数据

#### 成绩数据
- **ADMIN/SCHOOL_ADMIN**: 可查看所有成绩
- **GRADE_DIRECTOR**: 仅可查看授权年级的成绩
- **HEAD_TEACHER**: 仅可查看授权班级的成绩
- **SUBJECT_TEACHER**: 仅可查看授课班级+授权学科的成绩
- **STUDENT**: 仅可查看自己的成绩

#### 德育数据
- **ADMIN/SCHOOL_ADMIN**: 可查看所有德育记录
- **GRADE_DIRECTOR**: 仅可查看授权年级的德育记录
- **HEAD_TEACHER**: 仅可查看授权班级的德育记录
- **STUDENT**: 仅可查看自己的德育记录

---

## 学生特殊权限

### 学生数据范围限制

学生在数据权限页面有特殊处理：

1. **年级过滤**: 仅显示学生所属年级
2. **班级过滤**: 仅显示学生所属年级下的班级
3. **默认勾选**: 自动勾选学生所属年级和班级
4. **学科隐藏**: 学生不显示学科选项卡

### 学生可访问功能

| 功能 | 权限 |
|------|------|
| 查看个人信息 | ✅ |
| 修改密码 | ✅ |
| 查看个人成绩 | ✅ |
| 查看个人德育记录 | ✅ |
| 填写表单 | ✅ |

---

## 权限检查实现

### 后端权限守卫

```typescript
// 权限守卫示例
@UseGuards(PermissionsGuard)
@RequirePermissions('students:view')
getStudents() {
  // ...
}
```

### 数据范围过滤

```typescript
// 数据范围过滤示例
async getStudents(userId: string) {
  const user = await this.getUser(userId);
  
  if (user.role === 'ADMIN' || user.role === 'SCHOOL_ADMIN') {
    return this.prisma.students.findMany();
  }
  
  const classIds = await this.dataScopeService.getUserClassIds(userId);
  return this.prisma.students.findMany({
    where: { classId: { in: classIds } }
  });
}
```

### 前端权限控制

```typescript
// 菜单权限检查
const hasPermission = (permission: string) => {
  return user.permissions?.includes(permission) || 
         user.permissions?.includes('*');
};

// 按钮权限控制
{hasPermission('students:create') && (
  <Button>新增学生</Button>
)}
```
