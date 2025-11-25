import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// 中間件
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
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
app.listen(PORT, () => {
  console.log(`🚀 後端伺服器運行於 http://localhost:${PORT}`);
  console.log(`📍 API 端點: http://localhost:${PORT}/api`);
});
