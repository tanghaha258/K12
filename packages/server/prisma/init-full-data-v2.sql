-- ============================================
-- 完整基础数据初始化脚本 V2
-- 包含：管理员、年级、科目、班级、学生、教师、宿舍、考试、成绩
-- ============================================

-- 先禁用外键检查
SET FOREIGN_KEY_CHECKS = 0;

-- 清空相关表（保留基础结构）
TRUNCATE TABLE scores;
TRUNCATE TABLE exam_subjects;
TRUNCATE TABLE exams;
TRUNCATE TABLE dorm_beds;
TRUNCATE TABLE dorm_rooms;
TRUNCATE TABLE dorm_buildings;
TRUNCATE TABLE students;
TRUNCATE TABLE teachers;
TRUNCATE TABLE classes;
TRUNCATE TABLE subject_grades;
TRUNCATE TABLE subjects;
TRUNCATE TABLE grades;
TRUNCATE TABLE score_segments;
TRUNCATE TABLE score_lines;
TRUNCATE TABLE roles;

-- 清空用户表（保留管理员）
DELETE FROM users WHERE id != 'admin001';

-- 重新启用外键检查
SET FOREIGN_KEY_CHECKS = 1;

-- 1. 确保管理员账号存在
INSERT INTO users (id, account, password, name, role, status, createdAt, updatedAt)
VALUES ('admin001', 'admin', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '系统管理员', 'ADMIN', 'ACTIVE', NOW(), NOW())
ON DUPLICATE KEY UPDATE account = account;

-- 2. 初始化年级数据
INSERT INTO grades (id, name, entryYear, status, createdAt, updatedAt) VALUES
('grade_g1', '高一', 2024, 'active', NOW(), NOW()),
('grade_g2', '高二', 2023, 'active', NOW(), NOW()),
('grade_g3', '高三', 2022, 'active', NOW(), NOW());

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
('sub_dl', '地理', 'DL', 100, NOW(), NOW());

-- 4. 设置科目与年级的关联（语数英150分，其他100分）
INSERT INTO subject_grades (id, subjectId, gradeId, maxScore, createdAt) VALUES
(UUID(), 'sub_yw', 'grade_g1', 150, NOW()), (UUID(), 'sub_sx', 'grade_g1', 150, NOW()), (UUID(), 'sub_yy', 'grade_g1', 150, NOW()),
(UUID(), 'sub_wl', 'grade_g1', 100, NOW()), (UUID(), 'sub_hx', 'grade_g1', 100, NOW()), (UUID(), 'sub_sw', 'grade_g1', 100, NOW()),
(UUID(), 'sub_zz', 'grade_g1', 100, NOW()), (UUID(), 'sub_ls', 'grade_g1', 100, NOW()), (UUID(), 'sub_dl', 'grade_g1', 100, NOW()),
(UUID(), 'sub_yw', 'grade_g2', 150, NOW()), (UUID(), 'sub_sx', 'grade_g2', 150, NOW()), (UUID(), 'sub_yy', 'grade_g2', 150, NOW()),
(UUID(), 'sub_wl', 'grade_g2', 100, NOW()), (UUID(), 'sub_hx', 'grade_g2', 100, NOW()), (UUID(), 'sub_sw', 'grade_g2', 100, NOW()),
(UUID(), 'sub_zz', 'grade_g2', 100, NOW()), (UUID(), 'sub_ls', 'grade_g2', 100, NOW()), (UUID(), 'sub_dl', 'grade_g2', 100, NOW()),
(UUID(), 'sub_yw', 'grade_g3', 150, NOW()), (UUID(), 'sub_sx', 'grade_g3', 150, NOW()), (UUID(), 'sub_yy', 'grade_g3', 150, NOW()),
(UUID(), 'sub_wl', 'grade_g3', 100, NOW()), (UUID(), 'sub_hx', 'grade_g3', 100, NOW()), (UUID(), 'sub_sw', 'grade_g3', 100, NOW()),
(UUID(), 'sub_zz', 'grade_g3', 100, NOW()), (UUID(), 'sub_ls', 'grade_g3', 100, NOW()), (UUID(), 'sub_dl', 'grade_g3', 100, NOW());

-- 5. 初始化班级数据
INSERT INTO classes (id, name, gradeId, createdAt, updatedAt) VALUES
('class_g1_1', '1班', 'grade_g1', NOW(), NOW()), ('class_g1_2', '2班', 'grade_g1', NOW(), NOW()), ('class_g1_3', '3班', 'grade_g1', NOW(), NOW()),
('class_g2_1', '1班', 'grade_g2', NOW(), NOW()), ('class_g2_2', '2班', 'grade_g2', NOW(), NOW()), ('class_g2_3', '3班', 'grade_g2', NOW(), NOW()),
('class_g3_1', '1班', 'grade_g3', NOW(), NOW()), ('class_g3_2', '2班', 'grade_g3', NOW(), NOW()), ('class_g3_3', '3班', 'grade_g3', NOW(), NOW());

-- 6. 初始化宿舍楼宇
INSERT INTO dorm_buildings (id, name, floors, rooms, beds, status, createdAt, updatedAt) VALUES
('dorm_b1', '1号楼', 6, 30, 120, 'active', NOW(), NOW()),
('dorm_b2', '2号楼', 6, 30, 120, 'active', NOW(), NOW()),
('dorm_b3', '3号楼', 6, 30, 120, 'active', NOW(), NOW());

-- 7. 初始化宿舍房间
INSERT INTO dorm_rooms (id, buildingId, roomNo, floor, capacity, beds, gender, status, createdAt, updatedAt) VALUES
-- 1号楼 1-3层男生
('room_b1_101', 'dorm_b1', '101', 1, 4, 4, 'male', 'active', NOW(), NOW()),
('room_b1_102', 'dorm_b1', '102', 1, 4, 4, 'male', 'active', NOW(), NOW()),
('room_b1_103', 'dorm_b1', '103', 1, 4, 4, 'male', 'active', NOW(), NOW()),
('room_b1_201', 'dorm_b1', '201', 2, 4, 4, 'male', 'active', NOW(), NOW()),
('room_b1_202', 'dorm_b1', '202', 2, 4, 4, 'male', 'active', NOW(), NOW()),
('room_b1_203', 'dorm_b1', '203', 2, 4, 4, 'male', 'active', NOW(), NOW()),
('room_b1_301', 'dorm_b1', '301', 3, 4, 4, 'male', 'active', NOW(), NOW()),
('room_b1_302', 'dorm_b1', '302', 3, 4, 4, 'male', 'active', NOW(), NOW()),
-- 1号楼 4-6层女生
('room_b1_401', 'dorm_b1', '401', 4, 4, 4, 'female', 'active', NOW(), NOW()),
('room_b1_402', 'dorm_b1', '402', 4, 4, 4, 'female', 'active', NOW(), NOW()),
('room_b1_403', 'dorm_b1', '403', 4, 4, 4, 'female', 'active', NOW(), NOW()),
('room_b1_501', 'dorm_b1', '501', 5, 4, 4, 'female', 'active', NOW(), NOW()),
('room_b1_502', 'dorm_b1', '502', 5, 4, 4, 'female', 'active', NOW(), NOW()),
('room_b1_503', 'dorm_b1', '503', 5, 4, 4, 'female', 'active', NOW(), NOW()),
('room_b1_601', 'dorm_b1', '601', 6, 4, 4, 'female', 'active', NOW(), NOW()),
('room_b1_602', 'dorm_b1', '602', 6, 4, 4, 'female', 'active', NOW(), NOW());

-- 8. 初始化宿舍床位
INSERT INTO dorm_beds (id, roomId, bedNo, status, createdAt, updatedAt) VALUES
('room_b1_101_bed1', 'room_b1_101', '1', 'empty', NOW(), NOW()),
('room_b1_101_bed2', 'room_b1_101', '2', 'empty', NOW(), NOW()),
('room_b1_101_bed3', 'room_b1_101', '3', 'empty', NOW(), NOW()),
('room_b1_101_bed4', 'room_b1_101', '4', 'empty', NOW(), NOW()),
('room_b1_102_bed1', 'room_b1_102', '1', 'empty', NOW(), NOW()),
('room_b1_102_bed2', 'room_b1_102', '2', 'empty', NOW(), NOW()),
('room_b1_102_bed3', 'room_b1_102', '3', 'empty', NOW(), NOW()),
('room_b1_102_bed4', 'room_b1_102', '4', 'empty', NOW(), NOW()),
('room_b1_401_bed1', 'room_b1_401', '1', 'empty', NOW(), NOW()),
('room_b1_401_bed2', 'room_b1_401', '2', 'empty', NOW(), NOW()),
('room_b1_401_bed3', 'room_b1_401', '3', 'empty', NOW(), NOW()),
('room_b1_401_bed4', 'room_b1_401', '4', 'empty', NOW(), NOW()),
('room_b1_402_bed1', 'room_b1_402', '1', 'empty', NOW(), NOW()),
('room_b1_402_bed2', 'room_b1_402', '2', 'empty', NOW(), NOW()),
('room_b1_402_bed3', 'room_b1_402', '3', 'empty', NOW(), NOW()),
('room_b1_402_bed4', 'room_b1_402', '4', 'empty', NOW(), NOW());

-- 9. 初始化教师数据
INSERT INTO users (id, account, password, name, role, status, createdAt, updatedAt) VALUES
('user_t001', 'T001', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '张老师', 'SUBJECT_TEACHER', 'ACTIVE', NOW(), NOW()),
('user_t002', 'T002', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '李老师', 'SUBJECT_TEACHER', 'ACTIVE', NOW(), NOW()),
('user_t003', 'T003', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '王老师', 'SUBJECT_TEACHER', 'ACTIVE', NOW(), NOW()),
('user_t004', 'T004', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '刘老师', 'SUBJECT_TEACHER', 'ACTIVE', NOW(), NOW()),
('user_t005', 'T005', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '陈老师', 'SUBJECT_TEACHER', 'ACTIVE', NOW(), NOW()),
('user_t006', 'T006', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '赵老师', 'CLASS_TEACHER', 'ACTIVE', NOW(), NOW()),
('user_t007', 'T007', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '孙老师', 'CLASS_TEACHER', 'ACTIVE', NOW(), NOW()),
('user_t008', 'T008', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '周老师', 'CLASS_TEACHER', 'ACTIVE', NOW(), NOW());

INSERT INTO teachers (id, userId, teacherNo, name, phone, createdAt, updatedAt) VALUES
('tea_001', 'user_t001', 'T001', '张老师', '13800138001', NOW(), NOW()),
('tea_002', 'user_t002', 'T002', '李老师', '13800138002', NOW(), NOW()),
('tea_003', 'user_t003', 'T003', '王老师', '13800138003', NOW(), NOW()),
('tea_004', 'user_t004', 'T004', '刘老师', '13800138004', NOW(), NOW()),
('tea_005', 'user_t005', 'T005', '陈老师', '13800138005', NOW(), NOW()),
('tea_006', 'user_t006', 'T006', '赵老师', '13800138006', NOW(), NOW()),
('tea_007', 'user_t007', 'T007', '孙老师', '13800138007', NOW(), NOW()),
('tea_008', 'user_t008', 'T008', '周老师', '13800138008', NOW(), NOW());

-- 10. 设置班主任
UPDATE classes SET headTeacherId = 'tea_006' WHERE id = 'class_g1_1';
UPDATE classes SET headTeacherId = 'tea_007' WHERE id = 'class_g1_2';
UPDATE classes SET headTeacherId = 'tea_008' WHERE id = 'class_g1_3';

-- 11. 初始化学生数据
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
('user_s010', '2024010', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '陈十二', 'STUDENT', 'ACTIVE', NOW(), NOW());

INSERT INTO students (id, userId, studentNo, gender, entryYear, gradeId, classId, boardingType, createdAt, updatedAt) VALUES
('stu_001', 'user_s001', '2024001', 'male', 2024, 'grade_g1', 'class_g1_1', 'boarding', NOW(), NOW()),
('stu_002', 'user_s002', '2024002', 'female', 2024, 'grade_g1', 'class_g1_1', '