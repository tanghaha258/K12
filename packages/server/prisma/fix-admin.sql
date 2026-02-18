DELETE FROM users WHERE account = 'admin';
INSERT INTO users (id, account, password, name, role, status, createdAt, updatedAt) 
VALUES ('admin001', 'admin', '$2a$10$zP/AHOLu7a6QuB68qgLIKOBqn.xazC582Voyb30gqZ7vwqssKXiEK', '系统管理员', 'ADMIN', 'ACTIVE', NOW(), NOW());
