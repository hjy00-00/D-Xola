const express = require('express');
const mqtt = require('mqtt');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');  // path 모듈 추가

const app = express();
const PORT = 3000; // 서버 포트

// MQTT 브로커 설정
const brokerUrl = 'mqtt://192.168.120.93:1884';   // MQTT 브로커 주소 (핫스팟)
const topic = 'test/ArduiNoTopic'; // 아두이노에서 보낸 토픽

// MQTT 클라이언트 생성
const client = mqtt.connect(brokerUrl);

let latestMessages = []; // 최신 메시지 5개를 저장할 배열

// MQTT 연결 및 메시지 처리
client.on('connect', () => {
  console.log('Connected to MQTT Broker');
  client.subscribe(topic, (err) => {
    if (!err) {
      console.log(`Subscribed to topic: ${topic}`);
    } else {
      console.error('Subscription error:', err);
    }
  });
});

// 연결 실패 시 오류 로그 확인
client.on('error', (err) => {
  console.error('MQTT Connection Error:', err);
});

client.on('message', (topic, message) => {
  console.log(`Received message: ${message.toString()}`);
  
  // 수신된 메시지를 JSON 형태로 파싱
  try {
    const parsedMessage = JSON.parse(message.toString());

    // 각 센서와 모터의 값을 최신 데이터 배열에 추가
    latestMessages.push(parsedMessage);

    // 최신 데이터가 5개를 초과하면 삭제
    if (latestMessages.length > 5) {
      latestMessages.shift();
    }

    // WebSocket을 통해 모든 연결된 클라이언트에 메시지를 전송
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(latestMessages)); // 최신 메시지 배열 전송
      }
    });
  } catch (err) {
    console.error('Error parsing message:', err);
  }
});

// Static 파일 서빙: dashboard.html 파일 제공
app.use(express.static(path.join(__dirname, '..'))); // C:\Users\jy\Desktop\dxola 디렉토리 내 파일을 서빙

// 서버와 WebSocket 서버 생성
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// WebSocket 연결 설정
wss.on('connection', (ws) => {
  console.log('New WebSocket client connected');
  ws.send(JSON.stringify(latestMessages)); // 새로운 클라이언트가 연결되면 최신 메시지를 보냄

  ws.on('close', () => {
    console.log('WebSocket client disconnected');
  });
});

// HTTP 서버 시작
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${PORT}`);
});
