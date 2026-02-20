-- ============================================
-- 完整基础数据初始化脚本
-- 包含：管理员、年级、科目、班级、学生、教师、宿舍、考试、成绩
-- ============================================

-- 1. 初始化管理员账号
INSERT INTO users (id, account, password, name, role, status, createdAt, updatedAt)
VALUES ('admin001', 'admin', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '系统管理员', 'ADMIN', 'ACTIVE', NOW(), NOW())
ON DUPLICATE KEY UPDATE account = account;

-- 2. 初始化年级数据
INSERT INTO grades (id, name, entryYear, status, createdAt, updatedAt) VALUES
('grade_g1', '高一', 2024, 'active', NOW(), NOW()),
('grade_g2', '高二', 2023, 'active', NOW(), NOW()),
('grade_g3', '高三', 2022, 'active', NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- 3. 初始化科目数据
INSERT INTO subjects (id, name, code, maxScore, createdAt, updatedAt) VALUES
('sub_yw', '语文', 'YW', 150, NOW(), NOW()),
('sub_sx', '数学', 'SX', 150, NOW(), NOW()),
('sub_yy', '英语', 'YY', 150, NOW(), NOW()),
('sub_wl', '物理', 'WL', 100, NOW(), NOW()),
('sub_hx', '化学', 'HX', 100, NOW(), NOW()),
('sub_sw', '生物', 'SW', 100, NOW(), NOW()),
('sub_zz', '政治', 'ZZ', 100, NOW(), NOW()),
('sub_ls', '历史', 'LS', 100, NOW(), NOW()),
('sub_dl', '地理', 'DL', 100, NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- 4. 设置科目与年级的关联（语数英150分，其他100分）
INSERT INTO subject_grades (id, subjectId, gradeId, maxScore, createdAt) VALUES
-- 高一
(UUID(), 'sub_yw', 'grade_g1', 150, NOW()), (UUID(), 'sub_sx', 'grade_g1', 150, NOW()), (UUID(), 'sub_yy', 'grade_g1', 150, NOW()),
(UUID(), 'sub_wl', 'grade_g1', 100, NOW()), (UUID(), 'sub_hx', 'grade_g1', 100, NOW()), (UUID(), 'sub_sw', 'grade_g1', 100, NOW()),
(UUID(), 'sub_zz', 'grade_g1', 100, NOW()), (UUID(), 'sub_ls', 'grade_g1', 100, NOW()), (UUID(), 'sub_dl', 'grade_g1', 100, NOW()),
-- 高二
(UUID(), 'sub_yw', 'grade_g2', 150, NOW()), (UUID(), 'sub_sx', 'grade_g2', 150, NOW()), (UUID(), 'sub_yy', 'grade_g2', 150, NOW()),
(UUID(), 'sub_wl', 'grade_g2', 100, NOW()), (UUID(), 'sub_hx', 'grade_g2', 100, NOW()), (UUID(), 'sub_sw', 'grade_g2', 100, NOW()),
(UUID(), 'sub_zz', 'grade_g2', 100, NOW()), (UUID(), 'sub_ls', 'grade_g2', 100, NOW()), (UUID(), 'sub_dl', 'grade_g2', 100, NOW()),
-- 高三
(UUID(), 'sub_yw', 'grade_g3', 150, NOW()), (UUID(), 'sub_sx', 'grade_g3', 150, NOW()), (UUID(), 'sub_yy', 'grade_g3', 150, NOW()),
(UUID(), 'sub_wl', 'grade_g3', 100, NOW()), (UUID(), 'sub_hx', 'grade_g3', 100, NOW()), (UUID(), 'sub_sw', 'grade_g3', 100, NOW()),
(UUID(), 'sub_zz', 'grade_g3', 100, NOW()), (UUID(), 'sub_ls', 'grade_g3', 100, NOW()), (UUID(), 'sub_dl', 'grade_g3', 100, NOW())
ON DUPLICATE KEY UPDATE maxScore = VALUES(maxScore);

-- 5. 初始化班级数据
INSERT INTO classes (id, name, gradeId, createdAt, updatedAt) VALUES
('class_g1_1', '1班', 'grade_g1', NOW(), NOW()), ('class_g1_2', '2班', 'grade_g1', NOW(), NOW()), ('class_g1_3', '3班', 'grade_g1', NOW(), NOW()),
('class_g2_1', '1班', 'grade_g2', NOW(), NOW()), ('class_g2_2', '2班', 'grade_g2', NOW(), NOW()), ('class_g2_3', '2班', 'grade_g2', NOW(), NOW()),
('class_g3_1', '1班', 'grade_g3', NOW(), NOW()), ('class_g3_2', '2班', 'grade_g3', NOW(), NOW()), ('class_g3_3', '3班', 'grade_g3', NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- 6. 初始化宿舍楼宇
INSERT INTO dorm_buildings (id, name, floors, rooms, beds, status, createdAt, updatedAt) VALUES
('dorm_b1', '1号楼', 6, 30, 120, 'active', NOW(), NOW()),
('dorm_b2', '2号楼', 6, 30, 120, 'active', NOW(), NOW()),
('dorm_b3', '3号楼', 6, 30, 120, 'active', NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- 7. 初始化宿舍房间（1号楼男生，2号楼女生，3号楼混合）
-- 1号楼 1-3层男生，4-6层女生
INSERT INTO dorm_rooms (id, buildingId, roomNo, floor, capacity, beds, gender, status, createdAt, updatedAt)
SELECT 
  CONCAT('room_b1_', LPAD(n, 3, '0')),
  'dorm_b1',
  CONCAT(FLOOR((n-1)/10)+1, LPAD((n-1)%10+1, 2, '0')),
  FLOOR((n-1)/10)+1,
  4, 4,
  CASE WHEN FLOOR((n-1)/10)+1 <= 3 THEN 'male' ELSE 'female' END,
  'active',
  NOW(), NOW()
FROM (SELECT 1 n UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 
      UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10) t1,
     (SELECT 1 n UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 
      UNION SELECT 6) t2
WHERE (t1.n-1)*6 + t2.n <= 60;

-- 8. 初始化宿舍床位
INSERT INTO dorm_beds (id, roomId, bedNo, status, createdAt, updatedAt)
SELECT 
  CONCAT(r.id, '_bed', b.bedNo),
  r.id,
  b.bedNo,
  'empty',
  NOW(), NOW()
FROM dorm_rooms r
CROSS JOIN (SELECT 1 bedNo UNION SELECT 2 UNION SELECT 3 UNION SELECT 4) b;

-- 9. 初始化教师数据
-- 先创建教师用户账号
INSERT INTO users (id, account, password, name, role, status, createdAt, updatedAt) VALUES
('user_t001', 'T001', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '张老师', 'SUBJECT_TEACHER', 'ACTIVE', NOW(), NOW()),
('user_t002', 'T002', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '李老师', 'SUBJECT_TEACHER', 'ACTIVE', NOW(), NOW()),
('user_t003', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '王老师', 'SUBJECT_TEACHER', 'ACTIVE', NOW(), NOW()),
('user_t004', 'T004', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '刘老师', 'SUBJECT_TEACHER', 'ACTIVE', NOW(), NOW()),
('user_t005', 'T005', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '陈老师', 'SUBJECT_TEACHER', 'ACTIVE', NOW(), NOW()),
('user_t006', 'T006', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '赵老师', 'CLASS_TEACHER', 'ACTIVE', NOW(), NOW()),
('user_t007', 'T007', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '孙老师', 'CLASS_TEACHER', 'ACTIVE', NOW(), NOW()),
('user_t008', 'T008', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '周老师', 'CLASS_TEACHER', 'ACTIVE', NOW(), NOW())
ON DUPLICATE KEY UPDATE account = VALUES(account);

-- 创建教师记录
INSERT INTO teachers (id, userId, teacherNo, name, phone, createdAt, updatedAt) VALUES
('tea_001', 'user_t001', 'T001', '张老师', '13800138001', NOW(), NOW()),
('tea_002', 'user_t002', 'T002', '李老师', '13800138002', NOW(), NOW()),
('tea_003', 'user_t003', 'T003', '王老师', '13800138003', NOW(), NOW()),
('tea_004', 'user_t004', 'T004', '刘老师', '13800138004', NOW(), NOW()),
('tea_005', 'user_t005', 'T005', '陈老师', '13800138005', NOW(), NOW()),
('tea_006', 'user_t006', 'T006', '赵老师', '13800138006', NOW(), NOW()),
('tea_007', 'user_t007', 'T007', '孙老师', '13800138007', NOW(), NOW()),
('tea_008', 'user_t008', 'T008', '周老师', '13800138008', NOW(), NOW())
ON DUPLICATE KEY UPDATE teacherNo = VALUES(teacherNo);

-- 10. 设置班主任
UPDATE classes SET headTeacherId = 'tea_006' WHERE id = 'class_g1_1';
UPDATE classes SET headTeacherId = 'tea_007' WHERE id = 'class_g1_2';
UPDATE classes SET headTeacherId = 'tea_008' WHERE id = 'class_g1_3';

-- 11. 初始化学生数据（高一1班 10名学生）
-- 先创建学生用户账号
INSERT INTO users (id, account, password, name, role, status, createdAt, updatedAt) VALUES
('user_s001', '2024001', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '张三', 'STUDENT', 'ACTIVE', NOW(), NOW()),
('user_s002', '2024002', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '李四', 'STUDENT', 'ACTIVE', NOW(), NOW()),
('user_s003', '2024003', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '王五', 'STUDENT', 'ACTIVE', NOW(), NOW()),
('user_s004', '2024004', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '赵六', 'STUDENT', 'ACTIVE', NOW(), NOW()),
('user_s005', '2024005', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '钱七', 'STUDENT', 'ACTIVE', NOW(), NOW()),
('user_s006', '2024006', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '孙八', 'STUDENT', 'ACTIVE', NOW(), NOW()),
('user_s007', '2024007', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '周九', 'STUDENT', 'ACTIVE', NOW(), NOW()),
('user_s008', '2024008', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '吴十', 'STUDENT', 'ACTIVE', NOW(), NOW()),
('user_s009', '2024009', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '郑十一', 'STUDENT', 'ACTIVE', NOW(), NOW()),
('user_s010', '2024010', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '陈十二', 'STUDENT', 'ACTIVE', NOW(), NOW())
ON DUPLICATE KEY UPDATE account = VALUES(account);

-- 创建学生记录
INSERT INTO students (id, userId, studentNo, gender, entryYear, gradeId, classId, boardingType, createdAt, updatedAt) VALUES
('stu_001', 'user_s001', '2024001', 'male', 2024, 'grade_g1', 'class_g1_1', 'boarding', NOW(), NOW()),
('stu_002', 'user_s002', '2024002', 'female', 2024, 'grade_g1', 'class_g1_1', 'boarding', NOW(), NOW()),
('stu_003', 'user_s003', '2024003', 'male', 2024, 'grade_g1', 'class_g1_1', 'day', NOW(), NOW()),
('stu_004', 'user_s004', '2024004', 'female', 2024, 'grade_g1', 'class_g1_1', 'boarding', NOW(), NOW()),
('stu_005', 'user_s005', '2024005', 'male', 2024, 'grade_g1', 'class_g1_1', 'day', NOW(), NOW()),
('stu_006', 'user_s006', '2024006', 'female', 2024, 'grade_g1', 'class_g1_1', 'boarding', NOW(), NOW()),
('stu_007', 'user_s007', '2024007', 'male', 2024, 'grade_g1', 'class_g1_1', 'day', NOW(), NOW()),
('stu_008', 'user_s008', '2024008', 'female', 2024, 'grade_g1', 'class_g1_1', 'boarding', NOW(), NOW()),
('stu_009', 'user_s009', '2024009', 'male', 2024, 'grade_g1', 'class_g1_1', 'day', NOW(), NOW()),
('stu_010', 'user_s010', '2024010', 'female', 2024, 'grade_g1', 'class_g1_1', 'boarding', NOW(), NOW())
ON DUPLICATE KEY UPDATE studentNo = VALUES(studentNo);

-- 分配宿舍床位
UPDATE dorm_beds SET studentId = 'stu_001', status = 'occupied' WHERE id = 'room_b1_001_bed1';
UPDATE dorm_beds SET studentId = 'stu_002', status = 'occupied' WHERE id = 'room_b1_001_bed2';
UPDATE dorm_beds SET studentId = 'stu_004', status = 'occupied' WHERE id = 'room_b1_002_bed1';
UPDATE dorm_beds SET studentId = 'stu_006', status = 'occupied' WHERE id = 'room_b1_002_bed2';
UPDATE dorm_beds SET studentId = 'stu_008', status = 'occupied' WHERE id = 'room_b1_003_bed1';
UPDATE dorm_beds SET studentId = 'stu_010', status = 'occupied' WHERE id = 'room_b1_003_bed2';

-- 更新学生宿舍信息
UPDATE students SET dormRoomId = 'room_b1_001', dormBedId = 'room_b1_001_bed1' WHERE id = 'stu_001';
UPDATE students SET dormRoomId = 'room_b1_001', dormBedId = 'room_b1_001_bed2' WHERE id = 'stu_002';
UPDATE students SET dormRoomId = 'room_b1_002', dormBedId = 'room_b1_002_bed1' WHERE id = 'stu_004';
UPDATE students SET dormRoomId = 'room_b1_002', dormBedId = 'room_b1_002_bed2' WHERE id = 'stu_006';
UPDATE students SET dormRoomId = 'room_b1_003', dormBedId = 'room_b1_003_bed1' WHERE id = 'stu_008';
UPDATE students SET dormRoomId = 'room_b1_003', dormBedId = 'room_b1_003_bed2' WHERE id = 'stu_010';

-- 12. 初始化分段规则
INSERT INTO score_segments (id, name, gradeId, subjectId, excellentMin, goodMin, passMin, failMax, isDefault, isActive, createdAt, updatedAt) VALUES
(UUID(), '高一默认规则', 'grade_g1', NULL, 135, 120, 90, 89, true, true, NOW(), NOW()),
(UUID(), '高二默认规则', 'grade_g2', NULL, 135, 120, 90, 89, true, true, NOW(), NOW()),
(UUID(), '高三默认规则', 'grade_g3', NULL, 135, 120, 90, 89, true, true, NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- 13. 初始化线位配置
INSERT INTO score_lines (id, name, type, gradeId, scoreValue, description, isActive, createdAt, updatedAt) VALUES
(UUID(), '一本线', 'ONE_BOOK', 'grade_g3', 520, '高考一本线参考', true, NOW(), NOW()),
(UUID(), '普高线', 'REGULAR', 'grade_g3', 450, '高考普高线参考', true, NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- 14. 初始化角色数据
INSERT INTO roles (id, name, code, description, permissions, createdAt, updatedAt, isSystem) VALUES
('role_admin', '系统管理员', 'ADMIN', '系统超级管理员，拥有所有权限', '{"all": true}', NOW(), NOW(), true),
('role_school_admin', '学校管理员', 'SCHOOL_ADMIN', '学校级别管理员', '{"school": true}', NOW(), NOW(), true),
('role_grade_admin', '年级管理员', 'GRADE_ADMIN', '年级级别管理员', '{"grade": true}', NOW(), NOW(), false),
('role_class_teacher', '班主任', 'CLASS_TEACHER', '班级管理员', '{"class": true}', NOW(), NOW(), false),
('role_subject_teacher', '任课教师', 'SUBJECT_TEACHER', '科目教师', '{"subject": true}', NOW(), NOW(), false)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- 15. 更新管理员角色
UPDATE users SET roleId = 'role_admin' WHERE id = 'admin001';

-- 16. 初始化考试数据
INSERT INTO exams (id, name, type, term, schoolYear, gradeId, status, startTime, endTime, createdAt, updatedAt) VALUES
('exam_001', '2024-2025学年第一学期期中考试', 'midterm', '2024-2025-1', '2024-2025', 'grade_g1', 'published', '2024-11-01 08:00:00', '2024-11-03 17:00:00', NOW(), NOW()),
('exam_002', '2024-2025学年第一学期期末考试', 'final', '2024-2025-1', '2024-2025', 'grade_g1', 'draft', '2025-01-15 08:00:00', '2025-01-17 17:00:00', NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- 17. 初始化考试科目关联
-- 期中考试
INSERT INTO exam_subjects (id, examId, subjectId, maxScore, excellentLine, passLine, lowLine, weight, includeInTotal, includeInRank, createdAt) VALUES
(UUID(), 'exam_001', 'sub_yw', 150, 135, 90, 60, 1, true, true, NOW()),
(UUID(), 'exam_001', 'sub_sx', 150, 135, 90, 60, 1, true, true, NOW()),
(UUID(), 'exam_001', 'sub_yy', 150, 135, 90, 60, 1, true, true, NOW()),
(UUID(), 'exam_001', 'sub_wl', 100, 90, 60, 40, 1, true, true, NOW()),
(UUID(), 'exam_001', 'sub_hx', 100, 90, 60, 40, 1, true, true, NOW()),
(UUID(), 'exam_001', 'sub_sw', 100, 90, 60, 40, 1, true, true, NOW()),
(UUID(), 'exam_001', 'sub_zz', 100, 90, 60, 40, 1, true, true, NOW()),
(UUID(), 'exam_001', 'sub_ls', 100, 90, 60, 40, 1, true, true, NOW()),
(UUID(), 'exam_001', 'sub_dl', 100, 90, 60, 40, 1, true, true, NOW())
ON DUPLICATE KEY UPDATE maxScore = VALUES(maxScore);

-- 18. 初始化成绩数据（期中考试）
-- 张三的成绩
INSERT INTO scores (id, studentId, examId, subjectId, rawScore, isAbsent, createdAt, updatedAt) VALUES
(UUID(), 'stu_001', 'exam_001', (SELECT id FROM exam_subjects WHERE examId='exam_001' AND subjectId='sub_yw' LIMIT 1), 125, false, NOW(), NOW()),
(UUID(), 'stu_001', 'exam_001', (SELECT id FROM exam_subjects WHERE examId='exam_001' AND subjectId='sub_sx' LIMIT 1), 138, false, NOW(), NOW()),
(UUID(), 'stu_001', 'exam_001', (SELECT id FROM exam_subjects WHERE examId='exam_001' AND subjectId='sub_yy' LIMIT 1), 132, false, NOW(), NOW()),
(UUID(), 'stu_001', 'exam_001', (SELECT id FROM exam_subjects WHERE examId='exam_001' AND subjectId='sub_wl' LIMIT 1), 85, false, NOW(), NOW()),
(UUID(), 'stu_001', 'exam_001', (SELECT id FROM exam_subjects WHERE examId='exam_001' AND subjectId='sub_hx' LIMIT 1), 78, false, NOW(), NOW()),
(UUID(), 'stu_001', 'exam_001', (SELECT id FROM exam_subjects WHERE examId='exam_001' AND subjectId='sub_sw' LIMIT 1), 82, false, NOW(), NOW()),
(UUID(), 'stu_001', 'exam_001', (SELECT id FROM exam_subjects WHERE examId='exam_001' AND subjectId='sub_zz' LIMIT 1), 88, false, NOW(), NOW()),
(UUID(), 'stu_001', 'exam_001', (SELECT id FROM exam_subjects WHERE examId='exam_001' AND subjectId='sub_ls' LIMIT 1), 75, false, NOW(), NOW()),
(UUID(), 'stu_001', 'exam_001', (SELECT id FROM exam_subjects WHERE examId='exam_001' AND subjectId='sub_dl' LIMIT 1), 80, false, NOW(), NOW());

-- 李四的成绩
INSERT INTO scores (id, studentId, examId, subjectId, rawScore, isAbsent, createdAt, updatedAt) VALUES
(UUID(), 'stu_002', 'exam_001', (SELECT id FROM exam_subjects WHERE examId='exam_001' AND subjectId='sub_yw' LIMIT 1), 118, false, NOW(), NOW()),
(UUID(), 'stu_002', 'exam_001', (SELECT id FROM exam_subjects WHERE examId='exam_001' AND subjectId='sub_sx' LIMIT 1), 125, false, NOW(), NOW()),
(UUID(), 'stu_002', 'exam_001', (SELECT id FROM exam_subjects WHERE examId='exam_001' AND subjectId='sub_yy' LIMIT 1), 128, false, NOW(), NOW()),
(UUID(), 'stu_002', 'exam_001', (SELECT id FROM exam_subjects WHERE examId='exam_001' AND subjectId='sub_wl' LIMIT 1), 92, false, NOW(), NOW()),
(UUID(), 'stu_002', 'exam_001', (SELECT id FROM exam_subjects WHERE examId='exam_001' AND subjectId='sub_hx' LIMIT 1), 88, false, NOW(), NOW()),
(UUID(), 'stu_002', 'exam_001', (SELECT id FROM exam_subjects WHERE examId='exam_001' AND subjectId='sub_sw' LIMIT 1), 85, false, NOW(), NOW()),
(UUID(), 'stu_002', 'exam_001', (SELECT id FROM exam_subjects WHERE examId='exam_001' AND subjectId='sub_zz' LIMIT 1), 90, false, NOW(), NOW()),
(UUID(), 'stu_002', 'exam_001', (SELECT id FROM exam_subjects WHERE examId='exam_001' AND subjectId='sub_ls' LIMIT 1), 82, false, NOW(), NOW()),
(UUID(), 'stu_002', 'exam_001', (SELECT id FROM exam_subjects WHERE examId='exam_001' AND subjectId='sub_dl' LIMIT 1), 86, false, NOW(), NOW());

-- 王五的成绩
INSERT INTO scores (id, studentId, examId, subjectId, rawScore, isAbsent, createdAt, updatedAt) VALUES
(UUID(), 'stu_003', 'exam_001', (SELECT id FROM exam_subjects WHERE examId='exam_001' AND subjectId='sub_yw' LIMIT 1), 95, false, NOW(), NOW()),
(UUID(), 'stu_003', 'exam_001', (SELECT id FROM exam_subjects WHERE examId='exam_001' AND subjectId='sub_sx' LIMIT 1), 88, false, NOW(), NOW()),
(UUID(), 'stu_003', 'exam_001', (SELECT id FROM exam_subjects WHERE examId='exam_001' AND subjectId='sub_yy' LIMIT 1), 92, false, NOW(), NOW()),
(UUID(), 'stu_003', 'exam_001', (SELECT id FROM exam_subjects WHERE examId='exam_001' AND subjectId='sub_wl' LIMIT 1), 65, false, NOW(), NOW()),
(UUID(), 'stu_003', 'exam_001', (SELECT id FROM exam_subjects WHERE examId='exam_001' AND subjectId='sub_hx' LIMIT 1), 58, false, NOW(), NOW()),
(UUID(), 'stu_003', 'exam_001', (SELECT id FROM exam_subjects WHERE examId='exam_001' AND subjectId='sub_sw' LIMIT 1), 62, false, NOW(), NOW()),
(UUID(), 'stu_003', 'exam_001', (SELECT id FROM exam_subjects WHERE examId='exam_001' AND subjectId='sub_zz' LIMIT 1), 70, false, NOW(), NOW()),
(UUID(), 'stu_003', 'exam_001', (SELECT id FROM exam_subjects WHERE examId='exam_001' AND subjectId='sub_ls' LIMIT 1), 68, false, NOW(), NOW()),
(UUID(), 'stu_003', 'exam_001', (SELECT id FROM exam_subjects WHERE examId='exam_001' AND subjectId='sub_dl' LIMIT 1), 72, false, NOW(), NOW());

-- 赵六的成绩
INSERT INTO scores (id, studentId, examId, subjectId, rawScore, isAbsent, createdAt, updatedAt) VALUES
(UUID(), 'stu_004', 'exam_001', (SELECT id FROM exam_subjects WHERE examId='exam_001' AND subjectId='sub_yw' LIMIT 1), 142, false, NOW(), NOW()),
(UUID(), 'stu_004', 'exam_001', (SELECT id FROM exam_subjects WHERE examId='exam_001' AND subjectId='sub_sx' LIMIT 1), 145, false, NOW(), NOW()),
(UUID(), 'stu_004', 'exam_001', (SELECT id FROM exam_subjects WHERE examId='exam_001' AND subjectId='sub_yy' LIMIT 1), 140, false, NOW(), NOW()),
(UUID(), 'stu_004', 'exam_001', (SELECT id FROM exam_subjects WHERE examId='exam_001' AND subjectId='sub_wl' LIMIT 1), 95, false, NOW(), NOW()),
(UUID(), 'stu_004', 'exam_001', (SELECT id FROM exam_subjects WHERE examId='exam_001' AND subjectId='sub_hx' LIMIT 1), 92, false, NOW(), NOW()),
(UUID(), 'stu_004', 'exam_001', (SELECT id FROM exam_subjects WHERE examId='exam_001' AND subjectId='sub_sw' LIMIT 1), 88, false, NOW(), NOW()),
(UUID(), 'stu_004', 'exam_001', (SELECT id FROM exam_subjects WHERE examId='exam_001' AND subjectId='sub_zz' LIMIT 1), 94, false, NOW(), NOW()),
(UUID(), 'stu_004', 'exam_001', (SELECT id FROM exam_subjects WHERE examId='exam_001' AND subjectId='sub_ls' LIMIT 1), 90, false, NOW(), NOW()),
(UUID(), 'stu_004', 'exam_001', (SELECT id FROM exam_subjects WHERE examId='exam_001' AND subjectId='sub_dl' LIMIT 1), 87, false, NOW(), NOW());

-- 钱七的成绩
INSERT INTO scores (id, studentId, examId, subjectId, rawScore, isAbsent, createdAt, updatedAt) VALUES
(UUID(), 'stu_005', 'exam_001', (SELECT id FROM exam_subjects WHERE examId='exam_001' AND subjectId='sub_yw' LIMIT 1), 108, false, NOW(), NOW()),
(UUID(), 'stu_005', 'exam_001', (SELECT id FROM exam_subjects WHERE examId='exam_001' AND subjectId='sub_sx' LIMIT 1), 115, false, NOW(), NOW()),
(UUID(), 'stu_005', 'exam_001', (SELECT id FROM exam_subjects WHERE examId='exam_001' AND subjectId='sub_yy' LIMIT 1), 112, false, NOW(), NOW()),
(UUID(), 'stu_005', 'exam_001', (SELECT id FROM exam_subjects WHERE examId='exam_001' AND subjectId='sub_wl' LIMIT 1), 72, false, NOW(), NOW()),
(UUID(), 'stu_005', 'exam_001', (SELECT id FROM exam_subjects WHERE examId='exam_001' AND subjectId='sub_hx' LIMIT 1), 68, false, NOW(), NOW()),
(UUID(), 'stu_005', 'exam_001', (SELECT id FROM exam_subjects WHERE examId='exam_001' AND subjectId='sub_sw' LIMIT 1), 75, false, NOW(), NOW()),
(UUID(), 'stu_005', 'exam_001', (SELECT id FROM exam_subjects WHERE examId='exam_001' AND subjectId='sub_zz' LIMIT 1), 80, false, NOW(), NOW()),
(UUID(), 'stu_005', 'exam_001', (SELECT id FROM exam_subjects WHERE examId='exam_001' AND subjectId='sub_ls' LIMIT 1), 78, false, NOW(), NOW()),
(UUID(), 'stu_005', 'exam_001', (SELECT id FROM exam_subjects WHERE examId='exam_001' AND subjectId='sub_dl' LIMIT 1), 74, false, NOW(), NOW());

SELECT '完整基础数据初始化完成！' AS message;
