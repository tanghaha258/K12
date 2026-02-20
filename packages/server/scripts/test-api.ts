import axios from 'axios';

async function test() {
  try {
    const res = await axios.get('http://localhost:3000/api/score-lines?gradeId=grade_g1');
    console.log('线位列表:', JSON.stringify(res.data, null, 2));
  } catch (error: any) {
    console.error('错误:', error.message);
  }
}

test();
