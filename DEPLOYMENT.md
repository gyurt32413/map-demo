# Vercel + Render 部署指南

## 📦 部署架構

- **前端**: Vercel (Vite)
- **後端**: Render (Express)

---

## 🚀 後端部署 (Render)

### 1. 準備後端專案

後端檔案位於 `server/` 目錄:

- `server/index.js` - 主要伺服器檔案
- `server/routes/` - API 路由
- `server/services/` - 業務邏輯

### 2. Render 部署步驟

1. 前往 [render.com](https://render.com)
2. 點擊 "New +" → "Web Service"
3. 連接你的 GitHub repository
4. 配置設定:

```
Name: map-demo-backend
Environment: Node
Region: Singapore (或最近的區域)
Branch: master
Build Command: npm install
Start Command: node server/index.js
```

### 3. 環境變數設定 (Render Dashboard)

在 Render 的 Environment 頁面新增:

```env
PORT=10000
NODE_ENV=production
USE_HTTPS=false

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com

# Facebook App
FACEBOOK_APP_ID=your-facebook-app-id

# 前端 URL (部署後更新)
CLIENT_URL=https://your-frontend.vercel.app
```

### 4. 更新 CORS 設定

確認 `server/index.js` 中的 CORS 設定:

```javascript
app.use(
  cors({
    origin: process.env.CLIENT_URL || "https://localhost:5173",
    credentials: true,
  })
);
```

---

## 🌐 前端部署 (Vercel)

### 1. 安裝 Vercel CLI (可選)

```bash
npm i -g vercel
```

### 2. Vercel 部署步驟

**方式一: 使用 Vercel CLI**

```bash
# 登入
vercel login

# 部署
vercel

# 生產環境部署
vercel --prod
```

**方式二: 使用 Vercel Dashboard**

1. 前往 [vercel.com](https://vercel.com)
2. 點擊 "Add New..." → "Project"
3. Import 你的 GitHub repository
4. 配置設定:

```
Framework Preset: Vite
Build Command: pnpm build
Output Directory: dist
Install Command: pnpm install
```

### 3. 環境變數設定 (Vercel Dashboard)

在 Settings → Environment Variables 新增:

```env
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
VITE_FACEBOOK_APP_ID=your-facebook-app-id
VITE_API_BASE_URL=https://your-backend.onrender.com
```

⚠️ **重要**:

- 後端部署完成後,複製 Render 給你的 URL (例如: `https://map-demo-backend.onrender.com`)
- 在 Vercel 環境變數中更新 `VITE_API_BASE_URL`
- 重新部署前端

---

## 🔑 OAuth 設定更新

### Google Cloud Console

1. 前往 [Google Cloud Console](https://console.cloud.google.com)
2. 選擇你的專案 → APIs & Services → Credentials
3. 編輯你的 OAuth 2.0 Client ID
4. 更新以下設定:

**授權的 JavaScript 來源:**

```
https://your-frontend.vercel.app
```

**授權的重新導向 URI:**

```
https://your-frontend.vercel.app
```

### Facebook Developers

1. 前往 [Facebook Developers](https://developers.facebook.com)
2. 選擇你的 App → Settings → Basic
3. 更新 App Domains:

```
your-frontend.vercel.app
```

4. 前往 Facebook Login → Settings
5. 更新 Valid OAuth Redirect URIs:

```
https://your-frontend.vercel.app
```

6. 更新 Site URL:

```
https://your-frontend.vercel.app
```

---

## ✅ 部署檢查清單

- [ ] 後端部署到 Render
- [ ] 確認後端健康檢查: `https://your-backend.onrender.com/api/health`
- [ ] 在 Vercel 設定環境變數 (包含後端 URL)
- [ ] 前端部署到 Vercel
- [ ] 更新 Google OAuth 設定
- [ ] 更新 Facebook App 設定
- [ ] 在 Render 更新 CLIENT_URL 環境變數為 Vercel URL
- [ ] 測試登入功能
- [ ] 測試地圖功能

---

## 🐛 常見問題

### Q: CORS 錯誤

**A**: 確認後端的 `CLIENT_URL` 環境變數正確設定為前端的 Vercel URL

### Q: OAuth 登入失敗

**A**: 確認 Google 和 Facebook 的回調 URL 已更新為生產環境 URL

### Q: API 請求失敗

**A**: 確認前端的 `VITE_API_BASE_URL` 正確設定為後端的 Render URL

### Q: Render 服務冷啟動慢

**A**: Render 免費方案會在 15 分鐘無活動後休眠,首次請求會較慢(約 30 秒)

---

## 📊 監控與日誌

### Render 日誌

Dashboard → Logs → 查看即時日誌

### Vercel 日誌

Project → Deployments → 點擊部署 → Functions → 查看日誌

---

## 🔄 更新部署

### 自動部署

Push 到 GitHub 的 master branch 會自動觸發 Vercel 和 Render 重新部署

### 手動部署

- **Render**: Dashboard → Manual Deploy
- **Vercel**: Dashboard → Redeploy

---

## 💰 費用估算

- **Vercel**: 免費方案 (100GB 頻寬/月)
- **Render**: 免費方案 (750 小時/月, 15 分鐘無活動會休眠)
- **總計**: $0/月 (免費方案)

如需升級:

- Vercel Pro: $20/月
- Render Starter: $7/月
