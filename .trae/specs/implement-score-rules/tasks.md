# 字典与规则模块完善 - Tasks

## Task 1: 数据库模型设计
Implement database schema for score segments and score lines.
- [ ] SubTask 1.1: Add `score_segments` table to schema.prisma
  - Fields: id, name, gradeId, subjectId, excellentMin, goodMin, passMin, failMax, isDefault, createdAt, updatedAt
- [ ] SubTask 1.2: Add `score_lines` table to schema.prisma
  - Fields: id, name, type(ONE_BOOK/REGULAR/CUSTOM), gradeId, scoreValue, description, isActive, createdAt, updatedAt
- [ ] SubTask 1.3: Add `subject_grades` junction table for many-to-many relationship
  - Fields: id, subjectId, gradeId
- [ ] SubTask 1.4: Run migration to create tables

## Task 2: 后端API开发 - 分段规则
Implement backend API for score segment management.
- [ ] SubTask 2.1: Create ScoreSegment DTOs (Create, Update, Query)
- [ ] SubTask 2.2: Create ScoreSegmentService with CRUD methods
- [ ] SubTask 2.3: Create ScoreSegmentController with REST endpoints
  - GET /api/score-segments (list with filters)
  - POST /api/score-segments (create)
  - PATCH /api/score-segments/:id (update)
  - DELETE /api/score-segments/:id (delete)
- [ ] SubTask 2.4: Add Swagger decorators

## Task 3: 后端API开发 - 线位配置
Implement backend API for score line management.
- [ ] SubTask 3.1: Create ScoreLine DTOs (Create, Update, Query)
- [ ] SubTask 3.2: Create ScoreLineService with CRUD methods
- [ ] SubTask 3.3: Create ScoreLineController with REST endpoints
  - GET /api/score-lines (list with filters)
  - POST /api/score-lines (create)
  - PATCH /api/score-lines/:id (update)
  - DELETE /api/score-lines/:id (delete)
- [ ] SubTask 3.4: Add Swagger decorators

## Task 4: 后端API开发 - 科目年级关联
Implement backend API for subject-grade relationship.
- [ ] SubTask 4.1: Update Subject DTO to include gradeIds array
- [ ] SubTask 4.2: Update SubjectService to handle grade associations
- [ ] SubTask 4.3: Add endpoint GET /api/dict/subjects/by-grade/:gradeId

## Task 5: 前端页面开发
Implement frontend pages for dictionary and rules management.
- [ ] SubTask 5.1: Update Dict.tsx with tabs (Subjects, Score Segments, Score Lines)
- [ ] SubTask 5.2: Create ScoreSegmentList component with CRUD operations
- [ ] SubTask 5.3: Create ScoreLineList component with CRUD operations
- [ ] SubTask 5.4: Update Subject management to support grade selection
- [ ] SubTask 5.5: Add API integration in api.ts

## Task 6: 测试验证
Verify all functionality works correctly.
- [ ] SubTask 6.1: Test score segment CRUD via API
- [ ] SubTask 6.2: Test score line CRUD via API
- [ ] SubTask 6.3: Test subject-grade association
- [ ] SubTask 6.4: Verify frontend pages work correctly

# Task Dependencies
- Task 2 depends on Task 1
- Task 3 depends on Task 1
- Task 4 depends on Task 1
- Task 5 depends on Task 2, 3, 4
- Task 6 depends on Task 5
