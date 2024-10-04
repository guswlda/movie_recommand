const express = require('express');
const cors = require('cors');
const path = require('path');
const spawn = require('child_process').spawn;
const PORT = 8080;
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

// 개발 환경 확인 함수
const isDevelopment = () => {
  return process.env.NODE_ENV == 'development';
};

// 환경에 따라 파이썬 경로 설정
const pythonExePath = isDevelopment()
  ? path.join('C:', 'conda', 'envs', 'recom_env', 'python.exe')
  : path.join('/home/ubuntu/miniconda', 'envs', 'myenv', 'bin', 'python3');

app.get('/', (req, res) => {
  res.send('Hello From node server!');
});

// Python 스크립트를 실행하는 함수 정의
function executePythonScript(scriptName, args, res, inputData = null) {
  const scriptPath = path.join(__dirname, scriptName);
  const result = spawn(pythonExePath, [scriptPath, ...args]);

  let responseData = '';

  // stdout으로 데이터를 누적해서 받음
  result.stdout.on('data', function (data) {
    responseData += data.toString();
  });

  // 스크립트 실행 완료 후 결과 처리
  result.on('close', (code) => {
    if (code === 0) {
      try {
        const jsonResponse = JSON.parse(responseData);
        res.status(200).json(jsonResponse);
      } catch (e) {
        res.status(500).json({ error: 'JSON 응답 파싱에 실패했습니다.' });
      }
    } else {
      res
        .status(500)
        .json({ error: `프로세스가 코드 ${code}로 종료되었습니다.` });
    }
  });

  // 오류 메시지 처리
  result.stderr.on('data', (data) => {
    console.log(`stderr: ${data}`);
  });

  // 입력 데이터가 있을 경우 stdin으로 전달
  if (inputData) {
    result.stdin.write(JSON.stringify(inputData));
    result.stdin.end(); // 입력 데이터 전송 완료
  }
}

// 라우트 정의, 각 라우트에서 반복된 부분을 함수 호출로 대체
app.get('/random/:count', (req, res) => {
  const count = req.params.count;
  executePythonScript('resolver.py', ['random', count], res);
});

app.get('/latest/:count', (req, res) => {
  const count = req.params.count;
  executePythonScript('resolver.py', ['latest', count], res);
});

app.get('/genres/:genre/:count', (req, res) => {
  const genre = req.params.genre;
  const count = req.params.count;
  executePythonScript('resolver.py', ['genres', genre, count], res);
});

app.get('/item-based/:item', (req, res) => {
  const item = req.params.item;
  executePythonScript('recommender.py', ['item-based', item], res);
});

app.post('/user-based', (req, res) => {
  const inputRatingDict = req.body;
  executePythonScript('recommender.py', ['user-based'], res, inputRatingDict);
});

// 서버 시작
app.listen(PORT, () => console.log(`Server is listening at ${PORT}`));
