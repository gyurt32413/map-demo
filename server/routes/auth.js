import express from 'express';
import jwt from 'jsonwebtoken';
import { verifyGoogleToken } from '../services/googleAuth.js';
import { verifyFacebookToken } from '../services/facebookAuth.js';

const router = express.Router();

// 簡易記憶體儲存（生產環境應使用資料庫）
const users = new Map();

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

    // 儲存或更新使用者資訊
    let userData = users.get(user.googleId) || {};
    userData = {
      ...userData,
      googleId: user.googleId,
      email: user.email,
      name: user.name,
      picture: user.picture,
      emailVerified: user.emailVerified,
    };
    users.set(user.googleId, userData);

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
        googleId: userData.googleId,
        email: userData.email,
        name: userData.name,
        picture: userData.picture,
        facebookId: userData.facebookId || null,
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
 * 驗證 JWT token 並返回完整使用者資訊
 */
router.get('/verify', authenticateToken, (req, res) => {
  const userData = users.get(req.user.userId);
  
  if (!userData) {
    return res.status(404).json({ 
      success: false, 
      error: '使用者不存在' 
    });
  }

  res.json({ 
    success: true, 
    user: {
      googleId: userData.googleId,
      email: userData.email,
      name: userData.name,
      picture: userData.picture,
      facebookId: userData.facebookId || null,
    }
  });
});

/**
 * POST /api/auth/bind-facebook
 * 綁定 Facebook 帳號
 */
router.post('/bind-facebook', authenticateToken, async (req, res) => {
  try {
    const { accessToken } = req.body;
    
    if (!accessToken) {
      return res.status(400).json({ 
        success: false, 
        error: '缺少 Facebook token' 
      });
    }

    // 驗證 Facebook token
    const result = await verifyFacebookToken(accessToken);
    
    if (!result.success) {
      return res.status(401).json({ 
        success: false, 
        error: 'Facebook token 驗證失敗' 
      });
    }

    const { user: fbUser } = result;
    const userId = req.user.userId;
    
    // 檢查該 Facebook ID 是否已被其他帳號綁定
    for (const [id, data] of users.entries()) {
      if (data.facebookId === fbUser.facebookId && id !== userId) {
        return res.status(400).json({ 
          success: false, 
          error: '此 Facebook 帳號已被其他 Google 帳號綁定' 
        });
      }
    }

    // 更新使用者資訊
    const userData = users.get(userId);
    userData.facebookId = fbUser.facebookId;
    userData.facebookEmail = fbUser.email;
    users.set(userId, userData);

    res.json({
      success: true,
      message: 'Facebook 綁定成功',
      user: {
        googleId: userData.googleId,
        email: userData.email,
        name: userData.name,
        picture: userData.picture,
        facebookId: userData.facebookId,
      }
    });

  } catch (error) {
    console.error('綁定 Facebook 錯誤:', error);
    res.status(500).json({ 
      success: false, 
      error: '伺服器錯誤' 
    });
  }
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
