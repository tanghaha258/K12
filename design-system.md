# K12 教务管理系统 - 设计系统（方案A：高级现代数据风格）

适用范围：管理端/教师端/学生端/分布屏的视觉与交互规范。目标是“现代、克制、高级”，同时保证数据密集场景的可读性与一致性。

## 1. 设计原则
- 数据优先：任何装饰（毛玻璃/渐变/阴影）不得降低表格与图表可读性。
- 层级清晰：用“背景层级 + 边框透明度 + 阴影 + 模糊”表达层级，不用花哨颜色堆叠。
- 交互有质感：hover/pressed/focus/disabled 状态齐全，动效短促、可打断、符合预期。
- 主题可切换：暗色优先，同时提供浅色主题；两套主题共享同一套 token 结构。

## 2. 技术方案（方案A）
- UI 基座：Tailwind CSS
- Headless 交互组件：Radix UI
- 组件封装：shadcn/ui（按需拷贝到项目内，便于深度定制）
- 动效：Framer Motion（用于抽屉/弹层/列表过渡/分布屏轮播）
- 表格：TanStack Table（复杂筛选/列配置/虚拟滚动）
- 图表：ECharts 或 Recharts（二选一；需要统一主题与 tooltip）

## 3. 设计 Token（CSS Variables）
约定：所有 token 以 CSS 变量提供，Tailwind 通过 `theme.extend` 映射。命名采用 `--ds-*` 前缀。

### 3.1 颜色（暗色为主）
- 背景层级
  - `--ds-bg`: 页面背景
  - `--ds-surface`: 卡片/容器
  - `--ds-surface-2`: 弹层/抽屉
  - `--ds-overlay`: 遮罩
- 文本
  - `--ds-fg`: 主文本
  - `--ds-fg-muted`: 次文本
  - `--ds-fg-subtle`: 弱提示
- 边框与分割
  - `--ds-border`: 常规边框
  - `--ds-divider`: 分割线
- 品牌与语义色
  - `--ds-primary`: 主色
  - `--ds-success` / `--ds-warning` / `--ds-danger` / `--ds-info`

建议暗色基准（可调）：
- `--ds-bg`: #0B1020
- `--ds-surface`: rgba(255,255,255,0.06)
- `--ds-surface-2`: rgba(255,255,255,0.10)
- `--ds-fg`: rgba(255,255,255,0.92)
- `--ds-fg-muted`: rgba(255,255,255,0.72)
- `--ds-border`: rgba(255,255,255,0.12)
- `--ds-divider`: rgba(255,255,255,0.08)
- `--ds-primary`: #7C3AED

### 3.2 毛玻璃（Glass）
约定：玻璃只用于容器/弹层/侧边栏，不用于表格单元格背景。
- `--ds-blur-sm`: 8px
- `--ds-blur-md`: 16px
- `--ds-blur-lg`: 24px
- `--ds-glass-bg`: rgba(255,255,255,0.08)
- `--ds-glass-border`: rgba(255,255,255,0.14)

玻璃组件必须满足：
- 有边框（`--ds-glass-border`）与轻阴影，否则层级不稳
- 内部信息密集区域（表格/图表）使用更实的 `--ds-surface` 背景

### 3.3 圆角与间距
- 圆角
  - `--ds-radius-sm`: 10px
  - `--ds-radius-md`: 14px
  - `--ds-radius-lg`: 18px
- 间距（采用 4px 基线）：4/8/12/16/20/24/32/40

### 3.4 阴影（暗色）
约定：阴影以柔和扩散为主，避免“硬黑边”。
- `--ds-shadow-sm`: 0 8px 24px rgba(0,0,0,0.24)
- `--ds-shadow-md`: 0 16px 40px rgba(0,0,0,0.32)
- `--ds-shadow-lg`: 0 24px 64px rgba(0,0,0,0.38)

### 3.5 字体与排版
- 字体：优先系统字体栈；数字/表格可启用 tabular-nums
- 字号：
  - 标题：20/18/16
  - 正文：14
  - 辅助：12
- 行高：正文 1.6，表格 1.4

## 4. 动效与交互规范
### 4.1 时长与曲线
- Hover：120ms（linear 或 ease-out）
- 弹层/抽屉：200ms（ease-out，进入）/ 160ms（ease-in，退出）
- 列表过渡：160ms（ease-out）

### 4.2 组件状态（必须齐全）
- Default / Hover / Active(Pressed) / Focus / Disabled / Loading
- Focus 必须可见：2px 外发光或描边（颜色用 `--ds-primary` 的透明版）

### 4.3 高风险操作
- 回滚导入、撤销德育事件、发布菜单/对象：二次确认 + 输入确认文本（可选）+ 强审计提示。

## 5. 核心组件规范（数据场景优先）
### 5.1 表格（最重要）
- 表头固定、首列可固定、操作列固定右侧
- 行 hover：背景轻微提亮（不超过 6%）
- 斑马纹：可选，透明度极低
- 支持密度切换：舒适/紧凑（默认紧凑以适配数据密集）
- 支持列配置：显示/隐藏、顺序、宽度（可选）

### 5.2 卡片与指标
- 指标卡使用 `--ds-surface-2`，边框 `--ds-border`，轻阴影
- 指标数字使用 tabular-nums，避免跳动

### 5.3 弹层与抽屉

#### 弹窗样式规范（强制统一）
所有弹窗必须使用以下统一结构，确保视觉一致性：

```html
<!-- 弹窗遮罩 - 必须包含 backdrop-blur 实现背景虚化 -->
<div class="fixed inset-0 z-50 flex items-center justify-center bg-ds-overlay/50 backdrop-blur-sm">
  <!-- 弹窗内容容器 - 使用 glass-card 实现毛玻璃效果 -->
  <div class="w-full max-w-md glass-card p-6">
    <!-- 头部：标题 + 关闭按钮 -->
    <div class="mb-4 flex items-center justify-between">
      <h2 class="text-lg font-semibold text-ds-fg">弹窗标题</h2>
      <button class="text-ds-fg-muted hover:text-ds-fg">
        <X class="h-5 w-5" />
      </button>
    </div>
    <!-- 内容区 -->
    <div class="space-y-4">
      ...
    </div>
  </div>
</div>
```

**关键样式类说明：**
- `bg-ds-overlay/50` - 半透明遮罩，50%透明度
- `backdrop-blur-sm` - 背景模糊效果（8px）
- `glass-card` - 毛玻璃卡片，包含：
  - `background: var(--ds-glass-bg)` - 玻璃背景色
  - `backdrop-filter: blur(var(--ds-blur-md))` - 16px模糊
  - `border: 1px solid var(--ds-glass-border)` - 玻璃边框
  - `border-radius: var(--ds-radius-md)` - 14px圆角

**按钮规范：**
- 主要按钮：`rounded-md bg-ds-primary px-4 py-2 text-sm font-medium text-white hover:bg-ds-primary/90`
- 次要按钮：`rounded-md border border-ds-border bg-ds-surface px-4 py-2 text-sm font-medium text-ds-fg hover:bg-ds-surface-2`

**尺寸规范：**
- 小弹窗（确认/提示）：`max-w-sm` (384px)
- 标准弹窗（表单）：`max-w-md` (448px)
- 大弹窗（导入/复杂表单）：`max-w-2xl` (672px)
- 最大高度：`max-h-[90vh]` 配合 `overflow-y-auto`

#### 抽屉（Drawer）
- 背景使用玻璃 `--ds-glass-bg` + `backdrop-filter: blur(var(--ds-blur-md))`
- 内容区内部再放 `--ds-surface` 容器承载表格/表单

### 5.4 表单
- 统一 label 宽度与对齐；错误提示不挤压布局（预留高度或在下方浮层）
- 必填标识统一：`*` + 颜色用 `--ds-danger`

### 5.5 图表
- 网格线弱化，tooltip 使用玻璃卡片
- 颜色不超过 6 个主色，语义色与系统一致
- 图例位置固定策略：默认右上或底部

## 6. 分布屏（TV）
- 背景更深、对比更高、字号更大
- 轮播模块不闪烁，过渡以淡入淡出为主

## 7. 可访问性与可用性
- 文字对比度满足数据场景（暗色：主文本对比必须明显）
- 键盘可达：Tab 顺序合理，弹层 focus trap
- 表格支持复制/导出入口明显

