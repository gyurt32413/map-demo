import dotenv from 'dotenv';
import express from 'express';
import https from 'https';
import fs from 'fs';
import cors from 'cors';
import authRoutes from './routes/auth.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const USE_HTTPS = process.env.USE_HTTPS === 'true';

// 中間件
app.use(cors({
  origin: process.env.CLIENT_URL || 'https://localhost:5173',
  credentials: true
}));
app.use(express.json());

// 路由
app.use('/api/auth', authRoutes);

// 健康檢查
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK',
    timestamp: new Date().toISOString()
  });
});

// 404 處理
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    error: '找不到該路由' 
  });
});

// 錯誤處理
app.use((err, req, res, next) => {
  console.error('伺服器錯誤:', err);
  res.status(500).json({ 
    success: false, 
    error: '伺服器內部錯誤' 
  });
});

// 啟動伺服器
if (USE_HTTPS) {
  // HTTPS 模式
  try {
    const privateKey = fs.readFileSync('cert/key.pem', 'utf8');
    const certificate = fs.readFileSync('cert/cert.pem', 'utf8');
    const credentials = { key: privateKey, cert: certificate };

    https.createServer(credentials, app).listen(PORT, () => {
      console.log(`🔒 後端伺服器運行於 https://localhost:${PORT}`);
      console.log(`📍 API 端點: https://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('❌ HTTPS 憑證載入失敗:', error.message);
    console.error('請執行: pnpm generate-cert');
    process.exit(1);
  }
} else {
  app.listen(PORT, () => {
    console.log(`🚀 後端伺服器運行於 http://localhost:${PORT}`);
    console.log(`📍 API 端點: http://localhost:${PORT}/api`);
  });
}
