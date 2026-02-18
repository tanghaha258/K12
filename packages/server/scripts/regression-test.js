/**
 * 阶段一 - 1.1: 现有功能回归测试报告
 * 测试所有已完成模块的CRUD功能
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';
let token = '';
let testResults = [];

// 测试记录
function recordTest(module, api, status, message = '') {
  testResults.push({
    module,
    api,
    status,
    message,
    timestamp: new Date().toISOString()
  });
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  console.log(`${icon} [${module}] ${api}: ${status}${message ? ' - ' + message : ''}`);
}

// 登录获取token
async function login() {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      account: 'admin',
      password: '123456'
    });
    token = response.data.accessToken;
    recordTest('认证', 'POST /auth/login', 'PASS', '获取token成功');
    return true;
  } catch (error) {
    recordTest('认证', 'POST /auth/login', 'FAIL', error.message);
    return false;
  }
}

// 测试年级管理
async function testGrades() {
  try {
    // 获取年级列表
    const listRes = await axios.get(`${BASE_URL}/org/grades`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    recordTest('年级管理', 'GET /org/grades', 'PASS', `获取${listRes.data.length}条记录`);

    // 创建年级
    const createRes = await axios.post(`${BASE_URL}/org/grades`, {
      name: '测试年级2026',
      entryYear: 2026
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const gradeId = createRes.data.id;
    recordTest('年级管理', 'POST /org/grades', 'PASS', `创建年级ID: ${gradeId}`);

    // 更新年级
    await axios.patch(`${BASE_URL}/org/grades/${gradeId}`, {
      name: '测试年级2026-更新'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    recordTest('年级管理', 'PATCH /org/grades/:id', 'PASS');

    // 删除年级
    await axios.delete(`${BASE_URL}/org/grades/${gradeId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    recordTest('年级管理', 'DELETE /org/grades/:id', 'PASS');

  } catch (error) {
    recordTest('年级管理', 'CRUD', 'FAIL', error.response?.data?.message || error.message);
  }
}

// 测试班级管理
async function testClasses() {
  try {
    // 获取班级列表
    const listRes = await axios.get(`${BASE_URL}/org/classes`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    recordTest('班级管理', 'GET /org/classes', 'PASS', `获取${listRes.data.length}条记录`);

    // 获取年级列表用于创建班级
    const gradesRes = await axios.get(`${BASE_URL}/org/grades`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (gradesRes.data.length === 0) {
      recordTest('班级管理', 'POST /org/classes', 'SKIP', '无可用年级');
      return;
    }

    // 创建班级
    const createRes = await axios.post(`${BASE_URL}/org/classes`, {
      name: '测试班级1班',
      gradeId: gradesRes.data[0].id
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const classId = createRes.data.id;
    recordTest('班级管理', 'POST /org/classes', 'PASS', `创建班级ID: ${classId}`);

    // 更新班级
    await axios.patch(`${BASE_URL}/org/classes/${classId}`, {
      name: '测试班级1班-更新'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    recordTest('班级管理', 'PATCH /org/classes/:id', 'PASS');

    // 删除班级
    await axios.delete(`${BASE_URL}/org/classes/${classId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    recordTest('班级管理', 'DELETE /org/classes/:id', 'PASS');

  } catch (error) {
    recordTest('班级管理', 'CRUD', 'FAIL', error.response?.data?.message || error.message);
  }
}

// 测试学生管理
async function testStudents() {
  try {
    // 获取学生列表
    const listRes = await axios.get(`${BASE_URL}/students`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    recordTest('学生管理', 'GET /students', 'PASS', `获取${listRes.data.length}条记录`);

    // 获取年级和班级
    const gradesRes = await axios.get(`${BASE_URL}/org/grades`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const classesRes = await axios.get(`${BASE_URL}/org/classes`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (gradesRes.data.length === 0 || classesRes.data.length === 0) {
      recordTest('学生管理', 'POST /students', 'SKIP', '无可用年级或班级');
      return;
    }

    // 生成唯一学号
    const uniqueStudentNo = `TEST${Date.now()}`;
    
    // 创建学生
    const createRes = await axios.post(`${BASE_URL}/students`, {
      studentNo: uniqueStudentNo,
      name: '测试学生',
      gender: '男',
      entryYear: 2024,
      gradeId: gradesRes.data[0].id,
      classId: classesRes.data[0].id
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const studentId = createRes.data.id;
    recordTest('学生管理', 'POST /students', 'PASS', `创建学生ID: ${studentId}`);

    // 更新学生
    await axios.patch(`${BASE_URL}/students/${studentId}`, {
      name: '测试学生-更新'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    recordTest('学生管理', 'PATCH /students/:id', 'PASS');

    // 删除学生
    await axios.delete(`${BASE_URL}/students/${studentId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    recordTest('学生管理', 'DELETE /students/:id', 'PASS');

  } catch (error) {
    recordTest('学生管理', 'CRUD', 'FAIL', error.response?.data?.message || error.message);
  }
}

// 测试教师管理
async function testTeachers() {
  try {
    // 获取教师列表
    const listRes = await axios.get(`${BASE_URL}/teachers`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    recordTest('教师管理', 'GET /teachers', 'PASS', `获取${listRes.data.length}条记录`);

    // 生成唯一工号
    const uniqueTeacherNo = `T${Date.now()}`;
    
    // 创建教师
    const createRes = await axios.post(`${BASE_URL}/teachers`, {
      teacherNo: uniqueTeacherNo,
      name: '测试教师',
      gender: '男'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const teacherId = createRes.data.id;
    recordTest('教师管理', 'POST /teachers', 'PASS', `创建教师ID: ${teacherId}`);

    // 更新教师
    await axios.patch(`${BASE_URL}/teachers/${teacherId}`, {
      name: '测试教师-更新'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    recordTest('教师管理', 'PATCH /teachers/:id', 'PASS');

    // 删除教师
    await axios.delete(`${BASE_URL}/teachers/${teacherId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    recordTest('教师管理', 'DELETE /teachers/:id', 'PASS');

  } catch (error) {
    recordTest('教师管理', 'CRUD', 'FAIL', error.response?.data?.message || error.message);
  }
}

// 测试宿舍管理
async function testDorms() {
  try {
    // 获取宿舍楼列表
    const listRes = await axios.get(`${BASE_URL}/dorms/buildings`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    recordTest('宿舍管理', 'GET /dorms/buildings', 'PASS', `获取${listRes.data.length}条记录`);

    // 创建宿舍楼
    const createRes = await axios.post(`${BASE_URL}/dorms/buildings`, {
      name: '测试楼栋',
      floors: 5,
      roomsPerFloor: 10,
      bedsPerRoom: 4
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const buildingId = createRes.data.id;
    recordTest('宿舍管理', 'POST /dorms/buildings', 'PASS', `创建楼栋ID: ${buildingId}`);

    // 获取宿舍统计
    const statsRes = await axios.get(`${BASE_URL}/dorms/statistics`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    recordTest('宿舍管理', 'GET /dorms/statistics', 'PASS');

    // 删除宿舍楼
    await axios.delete(`${BASE_URL}/dorms/buildings/${buildingId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    recordTest('宿舍管理', 'DELETE /dorms/buildings/:id', 'PASS');

  } catch (error) {
    recordTest('宿舍管理', 'CRUD', 'FAIL', error.response?.data?.message || error.message);
  }
}

// 测试用户管理
async function testUsers() {
  try {
    // 获取用户列表
    const listRes = await axios.get(`${BASE_URL}/users`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    recordTest('用户管理', 'GET /users', 'PASS', `获取${listRes.data.length}条记录`);

    // 获取用户详情
    const detailRes = await axios.get(`${BASE_URL}/users/admin001`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    recordTest('用户管理', 'GET /users/:id', 'PASS');

  } catch (error) {
    recordTest('用户管理', 'API', 'FAIL', error.response?.data?.message || error.message);
  }
}

// 测试角色管理
async function testRoles() {
  try {
    // 获取角色列表
    const listRes = await axios.get(`${BASE_URL}/roles`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    recordTest('角色管理', 'GET /roles', 'PASS', `获取${listRes.data.length}条记录`);

    // 获取菜单列表
    const menuRes = await axios.get(`${BASE_URL}/roles/menu/list`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    recordTest('角色管理', 'GET /roles/menu/list', 'PASS', `获取${menuRes.data.length}个菜单`);

  } catch (error) {
    recordTest('角色管理', 'API', 'FAIL', error.response?.data?.message || error.message);
  }
}

// 测试数据权限
async function testDataScopes() {
  try {
    // 获取数据权限列表
    const listRes = await axios.get(`${BASE_URL}/datascopes`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    recordTest('数据权限', 'GET /datascopes', 'PASS', `获取${listRes.data.length}条记录`);

    // 获取可选教师列表
    const teachersRes = await axios.get(`${BASE_URL}/datascopes/teachers`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    recordTest('数据权限', 'GET /datascopes/teachers', 'PASS', `获取${teachersRes.data.length}位教师`);

  } catch (error) {
    recordTest('数据权限', 'API', 'FAIL', error.response?.data?.message || error.message);
  }
}

// 测试字典管理
async function testDict() {
  try {
    // 获取字典类型
    const typesRes = await axios.get(`${BASE_URL}/dict/types`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    recordTest('字典管理', 'GET /dict/types', 'PASS', `获取${typesRes.data.length}种类型`);

    // 获取科目列表
    const subjectsRes = await axios.get(`${BASE_URL}/dict/subjects/all`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    recordTest('字典管理', 'GET /dict/subjects/all', 'PASS', `获取${subjectsRes.data.length}个科目`);

  } catch (error) {
    recordTest('字典管理', 'API', 'FAIL', error.response?.data?.message || error.message);
  }
}

// 生成测试报告
function generateReport() {
  console.log('\n========================================');
  console.log('       回归测试报告 - 阶段一 1.1');
  console.log('========================================\n');

  const passed = testResults.filter(r => r.status === 'PASS').length;
  const failed = testResults.filter(r => r.status === 'FAIL').length;
  const skipped = testResults.filter(r => r.status === 'SKIP').length;

  console.log(`总计: ${testResults.length} 项测试`);
  console.log(`✅ 通过: ${passed}`);
  console.log(`❌ 失败: ${failed}`);
  console.log(`⚠️ 跳过: ${skipped}`);
  console.log(`\n通过率: ${((passed / testResults.length) * 100).toFixed(1)}%\n`);

  if (failed > 0) {
    console.log('失败的测试项:');
    testResults.filter(r => r.status === 'FAIL').forEach(r => {
      console.log(`  ❌ [${r.module}] ${r.api}: ${r.message}`);
    });
  }

  console.log('\n========================================');
  console.log('测试时间:', new Date().toLocaleString());
  console.log('========================================');

  return { passed, failed, skipped, total: testResults.length };
}

// 主函数
async function main() {
  console.log('开始回归测试...\n');

  // 登录
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log('登录失败，终止测试');
    return;
  }

  console.log('\n--- 开始模块测试 ---\n');

  // 执行所有测试
  await testGrades();
  await testClasses();
  await testStudents();
  await testTeachers();
  await testDorms();
  await testUsers();
  await testRoles();
  await testDataScopes();
  await testDict();

  // 生成报告
  const report = generateReport();

  // 写入报告文件
  const fs = require('fs');
  const reportContent = {
    title: '阶段一 - 1.1 现有功能回归测试报告',
    date: new Date().toISOString(),
    summary: report,
    details: testResults
  };

  fs.writeFileSync(
    'c:\\Users\\14590\\Desktop\\教务2\\test-reports\\regression-test-report.json',
    JSON.stringify(reportContent, null, 2)
  );

  console.log('\n报告已保存至: test-reports/regression-test-report.json');
}

main().catch(console.error);
