const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/users',
  method: 'GET',
};

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      const chen = json.users.find(u => u.name === '陈哈哈');
      console.log('陈哈哈数据:');
      console.log(JSON.stringify(chen, null, 2));
    } catch (e) {
      console.error('解析失败:', e);
    }
  });
});

req.on('error', (e) => {
  console.error(`请求失败: ${e.message}`);
});

req.end();
