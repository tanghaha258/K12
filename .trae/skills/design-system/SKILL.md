---
name: "design-system"
description: "Defines the product UI design system (glassmorphism, tokens, motion, components). Invoke when user requests modern visual style, UI consistency, or design guidelines for pages."
---

# Design System

本技能用于在本项目中输出与维护“高级现代数据风格”的设计规范（方案A：Tailwind + Radix UI + shadcn/ui + Framer Motion），并确保所有页面的视觉与交互一致。

## 何时调用
- 用户提出：毛玻璃/高级感/现代化/交互质感/动效/主题色/暗色模式/统一UI
- 需要把“页面线框稿”升级为“可实现的UI规范、tokens与组件状态”
- 需要评审或修订：设计系统文档、UI布局文档、PRD中的视觉约束

## 输出要求
- 以设计 Token 为核心（颜色/层级/边框/模糊/阴影/圆角/字体/动效）并可落地为 CSS Variables
- 给出组件级规范（表格/卡片/弹层/抽屉/表单/图表/分布屏）
- 强调数据场景可读性：玻璃效果克制使用，避免影响表格与图表对比度
- 任何“高风险操作”必须包含二次确认与审计提示的交互规则

## 工作流程
1) 读取并对齐现有文档
   - 设计系统：[design-system.md](file:///c:/Users/14590/Desktop/%E6%95%99%E5%8A%A12/design-system.md)
   - UI线框与交互：[ui-design.md](file:///c:/Users/14590/Desktop/%E6%95%99%E5%8A%A12/ui-design.md)
   - 产品PRD：[prd.md](file:///c:/Users/14590/Desktop/%E6%95%99%E5%8A%A12/prd.md)
2) 若用户提出风格偏好（暗色/浅色/品牌色），先更新 tokens，再同步影响到 UI 文档与 PRD 的“视觉规范”段落。
3) 对关键页面给出可实现的组件组合与状态规范（hover/pressed/focus/loading/disabled）。
4) 校验：任何新增视觉规则不会降低数据可读性（表格/图表/分布屏）。

## 示例
### 示例A：用户说“不喜欢Ant风格，要毛玻璃高级感”
- 更新 design-system.md 的 tokens（背景层级/blur/阴影/边框透明度）
- 更新 ui-design.md 的“全局设计规范”与关键页面布局（弹层、表格、导入向导）
- 在 prd.md 加入“视觉与交互规范（引用 design-system.md）”

