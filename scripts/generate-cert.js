import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const certDir = path.join(process.cwd(), 'cert');

// 建立憑證目錄
if (!fs.existsSync(certDir)) {
  fs.mkdirSync(certDir);
  console.log('✅ 建立 cert/ 目錄');
}

try {
  // 產生自簽憑證 (有效期 365 天)
  const command = `openssl req -x509 -newkey rsa:2048 -nodes -sha256 -subj "/CN=localhost" -keyout cert/key.pem -out cert/cert.pem -days 365`;
  
  execSync(command, { stdio: 'inherit' });
  
  console.log('✅ 成功產生 SSL 憑證');
  console.log('📁 憑證位置:');
  console.log('   - cert/key.pem');
  console.log('   - cert/cert.pem');
  console.log('');
  console.log('⚠️  這是自簽憑證，瀏覽器會顯示安全警告，請點擊「繼續前往」');
  console.log('');
  console.log('🚀 現在可以執行: pnpm dev');
} catch (error) {
  console.error('❌ 產生憑證失敗');
  console.error('請確認已安裝 OpenSSL');
  console.error('');
  console.error('Windows 安裝方式:');
  console.error('  choco install openssl');
  console.error('  或下載: https://slproweb.com/products/Win32OpenSSL.html');
  console.error('');
  console.error('macOS/Linux:');
  console.error('  通常已預裝 OpenSSL');
  process.exit(1);
}
