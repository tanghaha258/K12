# 字典与规则模块完善 Spec

## Why
根据PRD 4.2.4 菜单：字典与规则的要求，需要完善成绩相关的规则配置能力，包括分段规则（优秀/及格/低分阈值）和线位配置（一本线/普高线/自定义线），为后续的考务成绩模块提供基础数据支撑。

## What Changes
- 新增 `score_segments` 表：分段规则配置（优秀/及格/低分阈值）
- 新增 `score_lines` 表：线位配置（一本线/普高线/自定义线）
- 完善 `subjects` 表：支持年级差异配置
- 后端API：CRUD接口实现
- 前端页面：字典与规则管理页面

## Impact
- Affected specs: PRD 4.2.4 字典与规则
- Affected code: 
  - 后端: schema.prisma, dict模块
  - 前端: Dict.tsx页面

## ADDED Requirements

### Requirement: 分段规则管理
The system SHALL provide 分段规则配置功能，支持按年级/科目设置优秀/及格/低分阈值。

#### Scenario: 创建分段规则
- **WHEN** 管理员创建分段规则
- **GIVEN** 提供规则名称、适用年级、适用科目、各分段阈值
- **THEN** 系统保存规则并返回成功

#### Scenario: 查询分段规则
- **WHEN** 管理员查询分段规则列表
- **GIVEN** 可按年级、科目筛选
- **THEN** 系统返回匹配的规则列表

### Requirement: 线位配置管理
The system SHALL provide 线位配置功能，支持设置一本线/普高线/自定义线，用于临界生分析。

#### Scenario: 创建线位配置
- **WHEN** 管理员创建线位配置
- **GIVEN** 提供线位名称、类型、适用年级、分数线值
- **THEN** 系统保存配置并返回成功

#### Scenario: 查询线位配置
- **WHEN** 管理员查询线位配置列表
- **GIVEN** 可按类型、年级筛选
- **THEN** 系统返回匹配的配置列表

### Requirement: 科目年级差异
The system SHALL support 科目按年级差异配置，不同年级可开设不同科目。

#### Scenario: 配置科目适用年级
- **WHEN** 管理员编辑科目
- **GIVEN** 设置该科目适用的年级列表
- **THEN** 系统保存年级-科目关联关系
