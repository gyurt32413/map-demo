import express from 'express';
import jwt from 'jsonwebtoken';
import { verifyGoogleToken } from '../services/googleAuth.js';

const router = express.Router();

/**
 * POST /api/auth/google-login
 * 驗證 Google token 並返回 JWT
 */
router.post('/google-login', async (req, res) => {
  try {
    const { credential } = req.body;
    
    if (!credential) {
      return res.status(400).json({ 
        success: false, 
        error: '缺少 Google token' 
      });
    }

    // 驗證 Google token
    const result = await verifyGoogleToken(credential);
    
    if (!result.success) {
      return res.status(401).json({ 
        success: false, 
        error: 'Token 驗證失敗' 
      });
    }

    const { user } = result;

    // 在這裡可以將使用者資訊存入資料庫
    // await saveUserToDatabase(user);

    // 產生自己的 JWT token
    const jwtToken = jwt.sign(
      { 
        userId: user.googleId,
        email: user.email,
        name: user.name
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      user: {
        email: user.email,
        name: user.name,
        picture: user.picture
      },
      token: jwtToken
    });

  } catch (error) {
    console.error('登入錯誤:', error);
    res.status(500).json({ 
      success: false, 
      error: '伺服器錯誤' 
    });
  }
});

/**
 * GET /api/auth/verify
 * 驗證 JWT token
 */
router.get('/verify', authenticateToken, (req, res) => {
  res.json({ 
    success: true, 
    user: req.user 
  });
});

/**
 * POST /api/auth/logout
 * 登出（前端需清除 token）
 */
router.post('/logout', authenticateToken, (req, res) => {
  res.json({ 
    success: true, 
    message: '登出成功' 
  });
});

/**
 * JWT 驗證中間件
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      error: '未提供 token' 
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ 
        success: false, 
        error: 'Token 無效或過期' 
      });
    }
    req.user = user;
    next();
  });
}

export default router;
