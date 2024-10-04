const express = require('express');
const cors = require('cors');
const path = require('path');
const spawn = require('child_process').spawn;
const PORT = 8080;
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

// dev
const isDevelopment = () => {
  return process.env.NODE_ENV == 'development';
};

// env 있을 경우 C, env 없는 경우 miniconda
const pythonExePath = isDevelopment()
  ? path.join('C:', 'conda', 'envs', 'recom_env', 'python.exe')
  : path.join('/home/ubuntu/miniconda', 'envs', 'myenv', 'bin', 'python3');

app.get('/', (req, res) => {
  res.send('Hello From node server!');
});

// Python 스크립트를 실행하는 함수 정의
function executePythonScript(scriptName, args, res) {
  const scriptPath = path.join(__dirname, scriptName);
  // const pythonPath = path.join(
  //   'C:',
  //   'conda',
  //   'envs',
  //   'recom_env',
  //   'python.exe'
  // );

  // deploy pythonPath
  // const pythonPath = path.join('__dirname', 'venv', 'bin', 'python3');

  // miniconda접근 환경
  // const pythonPath = path.join(
  //   '/home/ubuntu/miniconda',
  //   'envs',
  //   'myenv',
  //   'bin',
  //   'python3'
  // );

  const result = spawn(pythonExePath, [scriptPath, ...args]);

  let responseData = '';

  // 누적해서 값을 받음
  result.stdout.on('data', function (data) {
    responseData += data.toString();
  });

  // 데이터가 올 때 0 (성공), responseData를 json 형식으로 변환
  result.on('close', (code) => {
    if (code === 0) {
      try {
        const jsonResponse = JSON.parse(responseData);
        res.status(200).json(jsonResponse);
      } catch (e) {
        res.status(500).json({ error: 'Failed to parse JSON response' });
      }
    } else {
      res.status(500).json({ error: `Child Process exited with code ${code}` });
    }
  });

  // res error (json으로 변환되지 않으면 error)
  result.stderr.on('data', (data) => {
    console.log(`stderr: ${data}`);
  });
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

// 서버 시작
app.listen(PORT, () => console.log(`Server is listening at ${PORT}`));
