const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function main() {
  try {
    // 登录
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      account: 'admin',
      password: '123456'
    });
    const token = loginRes.data.accessToken;
    console.log('登录成功');

    // 获取年级列表
    const gradesRes = await axios.get(`${BASE_URL}/org/grades`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('年级列表:', gradesRes.data.length);

    if (gradesRes.data.length === 0) {
      console.log('无可用年级');
      return;
    }

    // 创建班级
    console.log('创建班级...');
    const createRes = await axios.post(`${BASE_URL}/org/classes`, {
      name: '测试班级PATCH',
      gradeId: gradesRes.data[0].id
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const classId = createRes.data.id;
    console.log('创建成功:', classId);

    // 更新班级
    console.log('更新班级...');
    try {
      const patchRes = await axios.patch(`${BASE_URL}/org/classes/${classId}`, {
        name: '测试班级PATCH-更新'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('更新成功:', patchRes.data);
    } catch (error) {
      console.error('更新失败:', error.response?.data || error.message);
    }

    // 删除班级
    console.log('删除班级...');
    await axios.delete(`${BASE_URL}/org/classes/${classId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('删除成功');

  } catch (error) {
    console.error('错误:', error.response?.data || error.message);
  }
}

main();
