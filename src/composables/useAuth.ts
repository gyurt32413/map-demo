import { ref, watch } from "vue";
import Cookies from "js-cookie";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const FACEBOOK_APP_ID = import.meta.env.VITE_FACEBOOK_APP_ID;
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

// 宣告 Facebook SDK
declare global {
  interface Window {
    FB: any;
    FB_APP_ID: string;
  }
}

export function useAuth(
  showAlert: (
    message: string,
    type: "success" | "error" | "info",
    title?: string
  ) => void
) {
  const userInfo = ref<any>(null);
  const userPictureError = ref(false);
  const isBindingFacebook = ref(false);
  const showLoginModal = ref(false);

  // 取得使用者姓名首字母
  const getInitials = (name: string): string => {
    if (!name) return "U";
    const parts = name.trim().split(" ").filter(Boolean);
    if (parts.length >= 2) {
      const first = parts[0]?.[0] || "";
      const last = parts[parts.length - 1]?.[0] || "";
      return (first + last).toUpperCase() || "U";
    }
    return parts[0]?.[0]?.toUpperCase() || "U";
  };

  // 初始化 Facebook SDK
  function initFacebookSDK() {
    if (document.getElementById("facebook-jssdk")) {
      return;
    }

    const script = document.createElement("script");
    script.id = "facebook-jssdk";
    script.src = "https://connect.facebook.net/zh_TW/sdk.js";
    script.async = true;
    script.defer = true;

    (window as any).fbAsyncInit = function () {
      window.FB.init({
        appId: FACEBOOK_APP_ID,
        cookie: true,
        xfbml: true,
        version: "v18.0",
      });
      console.log("✅ Facebook SDK 初始化完成");
    };

    document.body.appendChild(script);
  }

  // 渲染 Google 登入按鈕
  function renderGoogleButton() {
    const buttonDiv = document.getElementById("google-login-modal");
    if (buttonDiv && typeof google !== "undefined") {
      google.accounts.id.renderButton(buttonDiv, {
        theme: "filled_blue",
        size: "large",
        type: "standard",
        text: "signin_with",
        width: 300,
      });
    }
  }

  // 處理 Google 登入
  async function handleGoogleCredential(response: any) {
    const idToken = response.credential;
    console.log("收到 Google token，準備驗證...");

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/google-login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ credential: idToken }),
      });

      const data = await res.json();

      if (data.success) {
        console.log("✅ 登入成功:", data.user);

        Cookies.set("auth_token", data.token, { expires: 7 });
        userInfo.value = data.user;

        if (!data.user.facebookId) {
          showLoginModal.value = false;
          showAlert(
            `歡迎,${data.user.name}!\n\n請先綁定 Facebook 帳號以使用地圖功能。`,
            "info",
            "歡迎"
          );
        } else {
          showLoginModal.value = false;
          showAlert(`歡迎回來,${data.user.name}!`, "success", "登入成功");
        }
      } else {
        console.error("❌ 登入失敗:", data.error);
        showAlert("登入失敗,請重試", "error");
      }
    } catch (error) {
      console.error("❌ 網路錯誤:", error);
      showAlert("連線失敗，請檢查後端伺服器是否運行", "error", "網路錯誤");
    }
  }

  // 驗證現有 token
  async function verifyExistingToken(token: string) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/verify`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (data.success) {
        userInfo.value = data.user;
        console.log("✅ Token 驗證成功，自動登入");
        showLoginModal.value = false;
      } else {
        Cookies.remove("auth_token");
        showLoginModal.value = true;
      }
    } catch (error) {
      console.error("Token 驗證失敗:", error);
      Cookies.remove("auth_token");
      showLoginModal.value = true;
    }
  }

  // Facebook 登入
  function loginWithFacebook() {
    if (!window.FB) {
      showAlert("Facebook SDK 尚未載入，請稍後再試", "error", "系統錯誤");
      return;
    }

    isBindingFacebook.value = true;

    window.FB.login(
      (response: any) => {
        if (response.authResponse) {
          const accessToken = response.authResponse.accessToken;
          console.log("收到 Facebook token，準備登入...");

          const token = Cookies.get("auth_token");
          if (token) {
            bindFacebookToAccount(accessToken);
          } else {
            showAlert("目前僅支援 Google 登入後綁定 Facebook", "info", "提示");
            isBindingFacebook.value = false;
          }
        } else {
          console.log("使用者取消 Facebook 登入");
          isBindingFacebook.value = false;
        }
      },
      { scope: "public_profile,email" }
    );
  }

  // 綁定 Facebook
  function bindFacebook() {
    if (!window.FB) {
      showAlert("Facebook SDK 尚未載入，請稍後再試", "error", "系統錯誤");
      return;
    }

    isBindingFacebook.value = true;

    window.FB.login(
      (response: any) => {
        if (response.authResponse) {
          const accessToken = response.authResponse.accessToken;
          bindFacebookToAccount(accessToken);
        } else {
          console.log("使用者取消 Facebook 登入");
          isBindingFacebook.value = false;
        }
      },
      { scope: "public_profile" }
    );
  }

  // 綁定 Facebook 到現有帳號
  function bindFacebookToAccount(accessToken: string) {
    const token = Cookies.get("auth_token");

    fetch(`${API_BASE_URL}/api/auth/bind-facebook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ accessToken }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          userInfo.value = data.user;
          showLoginModal.value = false;
          showAlert(
            "現在您可以使用地圖功能了。",
            "success",
            "Facebook 綁定成功"
          );
        } else {
          showAlert(`綁定失敗: ${data.error}`, "error", "綁定失敗");
        }
        isBindingFacebook.value = false;
      })
      .catch((error) => {
        console.error("綁定失敗:", error);
        showAlert("綁定過程中發生錯誤", "error", "綁定錯誤");
        isBindingFacebook.value = false;
      });
  }

  // 登出
  function logout() {
    Cookies.remove("auth_token");
    userInfo.value = null;
    userPictureError.value = false;
    showLoginModal.value = true;
    showAlert("您已成功登出", "success", "登出成功");
  }

  // 初始化 Google SDK (等待載入完成)
  function initGoogleSDK() {
    if (typeof google !== "undefined" && GOOGLE_CLIENT_ID) {
      google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleCredential,
      });
      console.log("✅ Google SDK 初始化完成");
    } else if (!GOOGLE_CLIENT_ID) {
      console.error("❌ Google Client ID 未設定");
    } else {
      // Google SDK 還未載入,等待後重試
      setTimeout(initGoogleSDK, 100);
    }
  }

  // 初始化
  function initAuth() {
    // 初始化 Google SDK (帶重試機制)
    initGoogleSDK();

    // 初始化 Facebook SDK
    if (FACEBOOK_APP_ID) {
      initFacebookSDK();
    }

    // 檢查是否有已登入的 token
    const savedToken = Cookies.get("auth_token");
    if (savedToken) {
      verifyExistingToken(savedToken);
    } else {
      showLoginModal.value = true;
    }

    // 延遲渲染 Google 登入按鈕
    setTimeout(() => {
      renderGoogleButton();
    }, 100);
  }

  // 監聽 showLoginModal 變化,重新渲染 Google 按鈕
  watch(showLoginModal, (newValue) => {
    if (newValue) {
      setTimeout(() => {
        renderGoogleButton();
      }, 100);
    }
  });

  return {
    // State
    userInfo,
    userPictureError,
    isBindingFacebook,
    showLoginModal,

    // Methods
    getInitials,
    loginWithFacebook,
    bindFacebook,
    logout,
    initAuth,
  };
}
