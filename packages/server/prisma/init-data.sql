-- ============================================
-- 基础数据初始化脚本
-- ============================================

-- 1. 初始化管理员账号
INSERT INTO users (id, account, password, name, role, status, createdAt, updatedAt)
VALUES ('admin001', 'admin', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '系统管理员', 'ADMIN', 'ACTIVE', NOW(), NOW())
ON DUPLICATE KEY UPDATE account = account;

-- 2. 初始化年级数据（高中）
INSERT INTO grades (id, name, entryYear, status, createdAt, updatedAt) VALUES
('grade_g1', '高一', 2024, 'active', NOW(), NOW()),
('grade_g2', '高二', 2023, 'active', NOW(), NOW()),
('grade_g3', '高三', 2022, 'active', NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- 3. 初始化科目数据（支持不同年级不同满分）
-- 先插入科目基础信息
INSERT INTO subjects (id, name, code, maxScore, createdAt, updatedAt) VALUES
-- 高中科目（默认满分）
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

-- 4. 设置科目与年级的关联（高中语数英150分，其他100分）
INSERT INTO subject_grades (id, subjectId, gradeId, maxScore, createdAt) VALUES
-- 高一
(UUID(), 'sub_yw', 'grade_g1', 150, NOW()),
(UUID(), 'sub_sx', 'grade_g1', 150, NOW()),
(UUID(), 'sub_yy', 'grade_g1', 150, NOW()),
(UUID(), 'sub_wl', 'grade_g1', 100, NOW()),
(UUID(), 'sub_hx', 'grade_g1', 100, NOW()),
(UUID(), 'sub_sw', 'grade_g1', 100, NOW()),
(UUID(), 'sub_zz', 'grade_g1', 100, NOW()),
(UUID(), 'sub_ls', 'grade_g1', 100, NOW()),
(UUID(), 'sub_dl', 'grade_g1', 100, NOW()),
-- 高二
(UUID(), 'sub_yw', 'grade_g2', 150, NOW()),
(UUID(), 'sub_sx', 'grade_g2', 150, NOW()),
(UUID(), 'sub_yy', 'grade_g2', 150, NOW()),
(UUID(), 'sub_wl', 'grade_g2', 100, NOW()),
(UUID(), 'sub_hx', 'grade_g2', 100, NOW()),
(UUID(), 'sub_sw', 'grade_g2', 100, NOW()),
(UUID(), 'sub_zz', 'grade_g2', 100, NOW()),
(UUID(), 'sub_ls', 'grade_g2', 100, NOW()),
(UUID(), 'sub_dl', 'grade_g2', 100, NOW()),
-- 高三
(UUID(), 'sub_yw', 'grade_g3', 150, NOW()),
(UUID(), 'sub_sx', 'grade_g3', 150, NOW()),
(UUID(), 'sub_yy', 'grade_g3', 150, NOW()),
(UUID(), 'sub_wl', 'grade_g3', 100, NOW()),
(UUID(), 'sub_hx', 'grade_g3', 100, NOW()),
(UUID(), 'sub_sw', 'grade_g3', 100, NOW()),
(UUID(), 'sub_zz', 'grade_g3', 100, NOW()),
(UUID(), 'sub_ls', 'grade_g3', 100, NOW()),
(UUID(), 'sub_dl', 'grade_g3', 100, NOW())
ON DUPLICATE KEY UPDATE maxScore = VALUES(maxScore);

-- 5. 初始化班级数据
INSERT INTO classes (id, name, gradeId, createdAt, updatedAt) VALUES
-- 高一班级
('class_g1_1', '1班', 'grade_g1', NOW(), NOW()),
('class_g1_2', '2班', 'grade_g1', NOW(), NOW()),
('class_g1_3', '3班', 'grade_g1', NOW(), NOW()),
-- 高二班级
('class_g2_1', '1班', 'grade_g2', NOW(), NOW()),
('class_g2_2', '2班', 'grade_g2', NOW(), NOW()),
('class_g2_3', '3班', 'grade_g2', NOW(), NOW()),
-- 高三班级
('class_g3_1', '1班', 'grade_g3', NOW(), NOW()),
('class_g3_2', '2班', 'grade_g3', NOW(), NOW()),
('class_g3_3', '3班', 'grade_g3', NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- 6. 初始化分段规则（按年级设置）
INSERT INTO score_segments (id, name, gradeId, subjectId, excellentMin, goodMin, passMin, failMax, isDefault, isActive, createdAt, updatedAt) VALUES
-- 高一默认分段规则（语数英150分制：优秀135，良好120，及格90）
(UUID(), '高一默认规则', 'grade_g1', NULL, 135, 120, 90, 89, true, true, NOW(), NOW()),
-- 高二默认分段规则
(UUID(), '高二默认规则', 'grade_g2', NULL, 135, 120, 90, 89, true, true, NOW(), NOW()),
-- 高三默认分段规则
(UUID(), '高三默认规则', 'grade_g3', NULL, 135, 120, 90, 89, true, true, NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- 7. 初始化线位配置
INSERT INTO score_lines (id, name, type, gradeId, scoreValue, description, isActive, createdAt, updatedAt) VALUES
-- 一本线
(UUID(), '一本线', 'ONE_BOOK', 'grade_g3', 520, '高考一本线参考', true, NOW(), NOW()),
-- 普高线
(UUID(), '普高线', 'REGULAR', 'grade_g3', 450, '高考普高线参考', true, NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- 8. 初始化角色数据
INSERT INTO roles (id, name, code, description, permissions, createdAt, updatedAt, isSystem) VALUES
('role_admin', '系统管理员', 'ADMIN', '系统超级管理员，拥有所有权限', '{"all": true}', NOW(), NOW(), true),
('role_school_admin', '学校管理员', 'SCHOOL_ADMIN', '学校级别管理员', '{"school": true}', NOW(), NOW(), true),
('role_grade_admin', '年级管理员', 'GRADE_ADMIN', '年级级别管理员', '{"grade": true}', NOW(), NOW(), false),
('role_class_teacher', '班主任', 'CLASS_TEACHER', '班级管理员', '{"class": true}', NOW(), NOW(), false),
('role_subject_teacher', '任课教师', 'SUBJECT_TEACHER', '科目教师', '{"subject": true}', NOW(), NOW(), false)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- 9. 更新管理员角色
UPDATE users SET roleId = 'role_admin' WHERE id = 'admin001';

SELECT '基础数据初始化完成！' AS message;
