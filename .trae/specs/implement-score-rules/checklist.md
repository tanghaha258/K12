# 字典与规则模块完善 - Checklist

## 数据库模型
- [ ] `score_segments` 表已创建，包含所有必要字段
- [ ] `score_lines` 表已创建，包含所有必要字段
- [ ] `subject_grades` 关联表已创建
- [ ] Prisma迁移已执行，数据库结构正确

## 后端API - 分段规则
- [ ] ScoreSegment DTOs 已创建（Create, Update, Query）
- [ ] ScoreSegmentService 已实现CRUD方法
- [ ] ScoreSegmentController 已实现REST端点
- [ ] Swagger文档已添加
- [ ] API测试通过：GET /api/score-segments
- [ ] API测试通过：POST /api/score-segments
- [ ] API测试通过：PATCH /api/score-segments/:id
- [ ] API测试通过：DELETE /api/score-segments/:id

## 后端API - 线位配置
- [ ] ScoreLine DTOs 已创建（Create, Update, Query）
- [ ] ScoreLineService 已实现CRUD方法
- [ ] ScoreLineController 已实现REST端点
- [ ] Swagger文档已添加
- [ ] API测试通过：GET /api/score-lines
- [ ] API测试通过：POST /api/score-lines
- [ ] API测试通过：PATCH /api/score-lines/:id
- [ ] API测试通过：DELETE /api/score-lines/:id

## 后端API - 科目年级关联
- [ ] Subject DTO 已更新，支持gradeIds数组
- [ ] SubjectService 已更新，处理年级关联
- [ ] GET /api/dict/subjects/by-grade/:gradeId 端点已实现
- [ ] API测试通过

## 前端页面
- [ ] Dict.tsx 已更新，包含三个Tab（科目、分段规则、线位配置）
- [ ] ScoreSegmentList 组件已实现CRUD
- [ ] ScoreLineList 组件已实现CRUD
- [ ] Subject管理支持年级选择
- [ ] api.ts 已添加新API调用
- [ ] 前端页面功能测试通过

## 集成测试
- [ ] 分段规则完整流程测试通过
- [ ] 线位配置完整流程测试通过
- [ ] 科目年级关联测试通过
- [ ] 与现有功能无冲突
