# K12 教务管理系统 - UI设计规范

> 最后更新：2026-02-19

## 1. 设计系统

### 1.1 技术栈
- **CSS框架**: Tailwind CSS
- **组件库**: Radix UI + shadcn/ui
- **图标**: Lucide React
- **动效**: Framer Motion

### 1.2 设计风格
- **主风格**: Glassmorphism（玻璃拟态）
- **配色**: 深色主题 + 渐变强调色
- **圆角**: 统一使用 rounded-lg (8px)

---

## 2. 布局规范

### 2.1 整体布局
```
┌─────────────────────────────────────────────────┐
│ 顶部栏 (Logo + 学期选择 + 用户信息)              │
├──────────┬──────────────────────────────────────┤
│          │                                      │
│ 侧边栏   │           内容区                      │
│ (菜单)   │                                      │
│          │                                      │
│          │                                      │
└──────────┴──────────────────────────────────────┘
```

### 2.2 侧边栏
- 宽度: 240px（展开）/ 64px（收起）
- 背景: 玻璃效果 + 半透明
- 菜单项: 图标 + 文字，悬停高亮

### 2.3 顶部栏
- 高度: 64px
- 内容: Logo + 学期选择器 + 全局搜索 + 用户头像

---

## 3. 组件规范

### 3.1 弹窗 (Modal/Drawer)
```html
<!-- 背景遮罩 -->
<div class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
  <!-- 弹窗内容 -->
  <div class="glass-card p-6 rounded-lg">
    <!-- 标题 -->
    <h2 class="text-lg font-semibold mb-4">标题</h2>
    <!-- 内容 -->
    <div class="space-y-4">...</div>
    <!-- 底部按钮 -->
    <div class="flex justify-end gap-2 mt-6">
      <Button variant="outline">取消</Button>
      <Button>确定</Button>
    </div>
  </div>
</div>
```

### 3.2 按钮
```html
<!-- 主要按钮 -->
<Button class="bg-ds-primary text-white hover:bg-ds-primary/90">
  主要操作
</Button>

<!-- 次要按钮 -->
<Button variant="outline" class="border-ds-border hover:bg-ds-surface">
  次要操作
</Button>

<!-- 危险按钮 -->
<Button variant="destructive" class="text-ds-danger hover:bg-ds-danger/20">
  删除
</Button>
```

### 3.3 表格
```html
<table class="w-full">
  <thead class="bg-ds-surface border-b border-ds-border">
    <tr>
      <th class="px-4 py-3 text-left text-sm font-medium">列标题</th>
    </tr>
  </thead>
  <tbody>
    <tr class="hover:bg-ds-surface transition-colors">
      <td class="px-4 py-3 text-sm">数据</td>
    </tr>
  </tbody>
</table>
```

### 3.4 表单
```html
<div class="space-y-4">
  <!-- 输入框 -->
  <div>
    <Label class="text-sm font-medium mb-1">字段名</Label>
    <Input class="w-full" placeholder="请输入..." />
  </div>
  
  <!-- 选择框 -->
  <div>
    <Label class="text-sm font-medium mb-1">选择项</Label>
    <Select>
      <SelectTrigger>
        <SelectValue placeholder="请选择..." />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="1">选项1</SelectItem>
      </SelectContent>
    </Select>
  </div>
</div>
```

---

## 4. 页面模板

### 4.1 列表页
```
┌─────────────────────────────────────────────────┐
│ PageHeader                                       │
│ ├── 标题                                         │
│ └── 操作按钮（新增、导入、导出）                  │
├─────────────────────────────────────────────────┤
│ FilterBar                                        │
│ ├── 筛选条件                                     │
│ └── 搜索框                                       │
├─────────────────────────────────────────────────┤
│ Table                                            │
│ ├── 表头                                         │
│ ├── 数据行                                       │
│ └── 操作列                                       │
├─────────────────────────────────────────────────┤
│ Pagination                                       │
└─────────────────────────────────────────────────┘
```

### 4.2 详情页
```
┌─────────────────────────────────────────────────┐
│ 返回按钮 + 标题                                   │
├──────────────┬──────────────────────────────────┤
│              │                                  │
│  信息卡片    │           Tabs                    │
│  ├── 头像    │  ├── Tab1                        │
│  ├── 基本信息│  ├── Tab2                        │
│  └── 标签    │  └── Tab3                        │
│              │                                  │
│              │                                  │
└──────────────┴──────────────────────────────────┘
```

---

## 5. 交互规范

### 5.1 加载状态
- 页面加载: 骨架屏 (Skeleton)
- 按钮提交: Loading 动画 + 禁用状态
- 数据刷新: 轻量级加载指示

### 5.2 反馈提示
- 成功: Toast 绿色提示，3秒自动消失
- 错误: Toast 红色提示，需手动关闭
- 确认: Dialog 二次确认弹窗

### 5.3 表单验证
- 实时验证: 输入时即时反馈
- 提交验证: 提交前统一验证
- 错误提示: 字段下方红色文字

---

## 6. 响应式设计

### 6.1 断点
- sm: 640px
- md: 768px
- lg: 1024px
- xl: 1280px

### 6.2 适配规则
- 侧边栏: 小屏幕自动收起
- 表格: 小屏幕隐藏次要列
- 弹窗: 小屏幕全屏显示

---

## 7. 动效规范

### 7.1 过渡动画
- 页面切换: fade 200ms
- 弹窗出现: scale + fade 150ms
- 菜单展开: height 200ms

### 7.2 交互反馈
- 按钮悬停: 轻微放大 1.02
- 卡片悬停: 阴影加深
- 列表项悬停: 背景色变化

---

## 8. 颜色系统

### 8.1 主色调
```css
--ds-primary: #6366f1;      /* 主色 - 靛蓝 */
--ds-secondary: #8b5cf6;    /* 次色 - 紫色 */
--ds-accent: #06b6d4;       /* 强调色 - 青色 */
```

### 8.2 语义色
```css
--ds-success: #22c55e;      /* 成功 - 绿色 */
--ds-warning: #f59e0b;      /* 警告 - 橙色 */
--ds-danger: #ef4444;       /* 危险 - 红色 */
--ds-info: #3b82f6;         /* 信息 - 蓝色 */
```

### 8.3 背景色
```css
--ds-background: #0f0f23;   /* 主背景 */
--ds-surface: #1a1a2e;      /* 表面色 */
--ds-surface-2: #16213e;    /* 次表面色 */
```

### 8.4 文字色
```css
--ds-text: #ffffff;         /* 主文字 */
--ds-text-muted: #94a3b8;   /* 次要文字 */
--ds-text-disabled: #64748b;/* 禁用文字 */
```
