import https from 'https';

/**
 * 驗證 Facebook Access Token
 * @param {string} accessToken - Facebook Access Token
 * @returns {Promise<{success: boolean, user?: object, error?: string}>}
 */
export async function verifyFacebookToken(accessToken) {
  try {
    const appId = process.env.FACEBOOK_APP_ID;
    const appSecret = process.env.FACEBOOK_APP_SECRET;

    // 1. 驗證 token 是否有效
    const debugUrl = `https://graph.facebook.com/debug_token?input_token=${accessToken}&access_token=${appId}|${appSecret}`;
    
    const debugData = await fetchUrl(debugUrl);
    
    if (!debugData.data || !debugData.data.is_valid) {
      throw new Error('Facebook token 無效');
    }

    // 驗證 app_id 是否匹配
    if (debugData.data.app_id !== appId) {
      throw new Error('Token 的 app_id 不匹配');
    }

    // 2. 取得使用者資料 (只請求 public_profile 權限的資料)
    const userUrl = `https://graph.facebook.com/me?fields=id,name,picture&access_token=${accessToken}`;
    const userData = await fetchUrl(userUrl);

    return {
      success: true,
      user: {
        facebookId: userData.id,
        email: null, // email 需要應用程式審核，開發階段不使用
        name: userData.name,
        picture: userData.picture?.data?.url || null,
      },
    };
  } catch (error) {
    console.error('Facebook token 驗證失敗:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * 輔助函數：使用 HTTPS GET 請求
 */
function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error('回應格式錯誤'));
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}
