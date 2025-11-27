# 快速部署腳本

## 首次部署

### 1. 部署後端到 Render

```bash
# 1. 前往 https://render.com
# 2. 連接 GitHub repo
# 3. 建立 Web Service
# 4. 設定環境變數 (參考 DEPLOYMENT.md)
```

### 2. 部署前端到 Vercel

```bash
# 安裝 Vercel CLI
npm i -g vercel

# 登入
vercel login

# 首次部署 (會引導你設定專案)
vercel

# 生產環境部署
vercel --prod
```

或使用 npm script:

```bash
pnpm deploy:preview  # 預覽部署
pnpm deploy:vercel   # 生產部署
```

### 3. 設定環境變數

在 Vercel Dashboard → Settings → Environment Variables:

```
VITE_GOOGLE_CLIENT_ID=your-google-client-id
VITE_FACEBOOK_APP_ID=your-facebook-app-id
VITE_API_BASE_URL=https://your-backend.onrender.com
```

### 4. 更新 OAuth 回調 URL

**Google Console:**

- 授權 JavaScript 來源: `https://your-app.vercel.app`
- 授權重新導向 URI: `https://your-app.vercel.app`

**Facebook Developers:**

- App Domains: `your-app.vercel.app`
- Valid OAuth Redirect URIs: `https://your-app.vercel.app`

---

## 後續更新

推送到 GitHub master branch 會自動部署:

```bash
git add .
git commit -m "update: 功能更新"
git push origin master
```

---

## 環境變數對照表

| 環境變數              | 開發環境 (.env)       | 生產環境                          |
| --------------------- | --------------------- | --------------------------------- |
| VITE_API_BASE_URL     | http://localhost:3000 | https://your-backend.onrender.com |
| VITE_GOOGLE_CLIENT_ID | 開發用 Client ID      | 生產用 Client ID                  |
| VITE_FACEBOOK_APP_ID  | 開發用 App ID         | 生產用 App ID                     |

---

## 檢查清單

部署前確認:

- [ ] `.env.production` 已建立
- [ ] `vercel.json` 已配置
- [ ] 後端 CORS 設定已更新
- [ ] 所有敏感資訊都在環境變數中,不在程式碼裡

部署後確認:

- [ ] 後端健康檢查可訪問
- [ ] 前端可以正常載入
- [ ] OAuth 登入功能正常
- [ ] API 請求正常
- [ ] 地圖功能正常
