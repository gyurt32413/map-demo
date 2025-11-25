import https from 'https';

/**
 * 驗證 Google ID Token (使用原生 HTTPS)
 * @param {string} token - Google ID Token
 * @returns {Promise<Object>} 使用者資訊
 */
export async function verifyGoogleToken(token) {
  try {
    // 使用 Google 的 tokeninfo endpoint 驗證 token
    const url = `https://oauth2.googleapis.com/tokeninfo?id_token=${token}`;
    
    const payload = await new Promise((resolve, reject) => {
      https.get(url, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          if (res.statusCode === 200) {
            resolve(JSON.parse(data));
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
          }
        });
      }).on('error', (err) => {
        reject(err);
      });
    });
    
    // 驗證 audience (client ID)
    if (payload.aud !== process.env.GOOGLE_CLIENT_ID) {
      throw new Error('Token 的 audience 不匹配');
    }
    
    // 驗證 issuer
    if (payload.iss !== 'accounts.google.com' && payload.iss !== 'https://accounts.google.com') {
      throw new Error('Token 的 issuer 不正確');
    }
    
    // 驗證是否過期 (exp 是秒級時間戳)
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      throw new Error('Token 已過期');
    }
    
    return {
      success: true,
      user: {
        googleId: payload.sub,
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
        emailVerified: payload.email_verified,
      }
    };
  } catch (error) {
    console.error('Google token 驗證失敗:', error.message);
    return {
      success: false,
      error: 'Invalid token'
    };
  }
}
