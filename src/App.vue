<template>
  <div class="h-screen">
    <!-- 自訂 Alert Modal -->
    <AlertModal
      :show="alertModal.show"
      :type="alertModal.type"
      :title="alertModal.title"
      :message="alertModal.message"
      @close="closeAlert"
    />

    <!-- 登入 Modal -->
    <LoginModal :show="showLoginModal" @close="() => {}" />

    <!-- Nav -->
    <nav class="flex h-14 items-center border-b bg-gray-100 px-4 shadow-sm">
      <h1 class="text-xl font-semibold text-gray-800">地圖示範</h1>

      <!-- 使用者資訊 -->
      <div class="ml-auto flex items-center space-x-4">
        <template v-if="!isEmpty(userInfo)">
          <div class="flex items-center space-x-3">
            <!-- 使用者資訊 -->
            <div class="flex items-center space-x-2">
              <span class="text-sm">HI！{{ userInfo.name }}</span>
              <div
                v-if="userPictureError"
                class="flex size-10 items-center justify-center rounded-full bg-blue-500 font-semibold text-white"
                :title="userInfo.name"
              >
                {{ getInitials(userInfo.name) }}
              </div>
              <img
                v-else
                class="size-10 rounded-full"
                :src="userInfo.picture"
                alt="user-picture"
                @error="userPictureError = true"
              />
            </div>

            <!-- 綁定 Facebook 按鈕 -->
            <button
              v-if="!userInfo.facebookId"
              @click="bindFacebook"
              :disabled="isBindingFacebook"
              class="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {{ isBindingFacebook ? "綁定中..." : "綁定 Facebook" }}
            </button>
            <span v-else class="text-xs font-medium text-green-600">
              ✓ 已綁定 Facebook
            </span>

            <!-- 登出按鈕 -->
            <button
              @click="logout"
              class="rounded border border-gray-300 px-3 py-1 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-800"
            >
              登出
            </button>
          </div>
        </template>
        <template v-else>
          <button
            @click="showLoginModal = true"
            class="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
          >
            登入
          </button>
        </template>
      </div>
    </nav>

    <!-- Main -->
    <main
      v-if="!isEmpty(userInfo) && userInfo.facebookId"
      class="flex h-[calc(100%-56px)] mobile:flex-col"
    >
      <!-- Sidebar -->
      <div
        class="h-full w-[300px] mobile:h-1/2 border-r bg-gray-50 mobile:order-1 mobile:w-full"
      >
        <div class="p-4">
          <h2 class="mb-4 text-lg font-semibold mobile:hidden">搜尋地址</h2>

          <!-- 地址輸入 -->
          <div class="space-y-3">
            <div class="flex items-center space-x-2">
              <input
                type="text"
                placeholder="請輸入你要查詢的地址"
                class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                v-model="searchInput"
              />
              <button @click="searchAddress">
                <img src="./assets/search_icon.svg" alt="search-icon" />
              </button>
            </div>
          </div>

          <!-- 附近的都更案 -->
          <div class="mt-6 mobile:mt-2 top:border-t tablet:pt-4">
            <h3 class="mb-2 font-medium text-gray-700 mobile:hidden">
              地圖資訊
            </h3>
            <ul
              class="custom-scrollbar max-h-[600px] overflow-y-auto pr-1 mobile:max-h-[calc(50vh-120px)]"
            >
              <template
                v-for="(renewal, index) in filteredRenewals"
                :key="renewal.id"
              >
                <li
                  class="mb-3 flex cursor-pointer items-center justify-between rounded-md border border-gray-200 bg-white px-2 py-4 font-semibold shadow-sm"
                  @click="getRenewalInfo(renewal)"
                >
                  <div class="text-[18px] text-gray-800">
                    {{ renewal.stop_name }}
                  </div>

                  <div class="space-x-1 text-sm text-blue-400">
                    <span class="text-[30px]">{{ renewal.distance }}</span>
                    <span>km</span>
                  </div>
                </li>
              </template>
            </ul>
          </div>
        </div>
      </div>

      <!-- Map Container -->
      <div class="mobile:order-0 relative h-full w-full flex-1 mobile:h-1/2">
        <LeafletMap
          ref="mapComponent"
          :center="[mapCenter.lat, mapCenter.lng]"
          :zoom="13"
          @map-ready="onMapReady"
          @click="onMapClick"
        />

        <!-- 取得當前位置按鈕（地圖右下角） -->
        <button
          @click="getCurrentLocation"
          :disabled="isGettingLocation"
          :title="locationError || '取得當前位置'"
          class="absolute bottom-6 right-6 z-[1000] flex size-10 items-center justify-center rounded-lg border-2 border-gray-200 bg-white shadow-lg transition-all hover:border-blue-500 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
        >
          <!-- 瞄準器圖標 -->
          <img src="./assets/locate_icon.svg" alt="Locate Icon" />
        </button>
      </div>
    </main>

    <!-- 未綁定 Facebook 時的提示 -->
    <div
      v-else-if="!isEmpty(userInfo) && !userInfo.facebookId"
      class="flex h-[calc(100%-56px)] items-center justify-center bg-gray-50"
    >
      <div class="max-w-md text-center">
        <svg
          class="mx-auto mb-4 h-24 w-24 text-blue-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h3 class="mb-2 text-xl font-semibold text-gray-700">
          請先綁定 Facebook 帳號
        </h3>
        <p class="mb-4 text-gray-500">
          為了確保您的帳號安全，請先綁定 Facebook 帳號以使用地圖功能。
        </p>
        <button
          @click="bindFacebook"
          :disabled="isBindingFacebook"
          class="flex items-center justify-center gap-2 rounded-lg bg-[#1877F2] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#166FE5] disabled:cursor-not-allowed disabled:opacity-50 mx-auto"
        >
          <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
            <path
              d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
            />
          </svg>
          {{ isBindingFacebook ? "綁定中..." : "綁定 Facebook" }}
        </button>
      </div>
    </div>

    <!-- 未登入時的佔位內容 -->
    <div
      v-else
      class="flex h-[calc(100%-56px)] items-center justify-center bg-gray-50"
    >
      <div class="text-center">
        <svg
          class="mx-auto mb-4 h-24 w-24 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
          />
        </svg>
        <h3 class="mb-2 text-xl font-semibold text-gray-700">請先登入</h3>
        <p class="text-gray-500">使用 Google 帳號登入以繼續</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onMounted } from "vue";
import LeafletMap from "./components/LeafletMap.vue";
import AlertModal from "./components/AlertModal.vue";
import LoginModal from "./components/LoginModal.vue";
import type L from "leaflet";
import { useFetchNearbyRenewal } from "./api/useFetchNearbyRenewal";
import { useFetchRenewalPolygon } from "./api/useFetchRenewalPolygon";
import { debounce, useCloneDeep, isEmpty } from "./utils/functionUtils";
import Cookies from "js-cookie";

let map: L.Map | null = null;
let userLocationMarker: L.Marker | null = null;

// 響應式資料
const mapComponent = ref();
const mapZoom = ref(13);
const isGettingLocation = ref(false);
const locationError = ref<string | null>(null);
const searchInput = ref("");

const mapCenter = reactive({
  lat: 25.033,
  lng: 121.5654,
});

const setMapCenter = (lat: number, lng: number) => {
  mapCenter.lat = lat;
  mapCenter.lng = lng;
};

const clickedLocation = ref<{ lat: number; lng: number } | null>(null);

const setClickedLocation = (lat: number, lng: number) => {
  clickedLocation.value = { lat, lng };
};

// 地圖事件處理
const onMapReady = (mapInstance: L.Map) => {
  map = mapInstance;

  // 監聽地圖移動事件
  map.on("moveend", () => {
    if (map) {
      const center = map.getCenter();
      setMapCenter(center.lat, center.lng);

      // 地圖移動時自動查詢附近資料
      fetchNearbyRenewalsWithDebounce(center.lat, center.lng);
    }
  });

  // 監聽地圖縮放事件 (只更新 zoom 值，不觸發查詢)
  map.on("zoomend", () => {
    if (map) {
      mapZoom.value = map.getZoom();
    }
  });

  // 取得都更案範圍多邊形
  getRenewalPolygon();
};

const onMapClick = (event: L.LeafletMouseEvent) => {
  setClickedLocation(event.latlng.lat, event.latlng.lng);

  fetchNearbyRenewals(event.latlng.lat, event.latlng.lng);
};

const getRenewalInfo = (renewal: NearbyRenewalResult) => {
  console.log("Selected renewal info:", renewal);

  // 飛往該都更地點
  if (mapComponent.value) {
    mapComponent.value.flyTo(renewal.latitude, renewal.longitude, 16);

    // 觸發 marker 跳動動畫
    setTimeout(() => {
      mapComponent.value.bounceMarker(renewal.latitude, renewal.longitude);
    }, 500); // 等待飛行動畫完成後再跳動
  }
};

// === 取得當前位置功能 ===
const getCurrentLocation = () => {
  if (!navigator.geolocation) {
    locationError.value = "您的瀏覽器不支援定位功能";
    return;
  }

  isGettingLocation.value = true;
  locationError.value = null;

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords;

      // 更新座標
      mapCenter.lat = latitude;
      mapCenter.lng = longitude;

      // 移除舊的當前位置標記
      if (mapComponent.value) {
        mapComponent.value.clearMarkers("user");
      }

      // 添加當前位置標記（使用頭像或預設圖標）
      if (mapComponent.value) {
        // 優先使用 Facebook 頭像，其次使用 Google 頭像
        const avatarUrl =
          userInfo.value?.facebookPicture || userInfo.value?.picture || "";
        const userName = userInfo.value?.name || "您";

        if (avatarUrl) {
          userLocationMarker = mapComponent.value.addUserMarker({
            lat: latitude,
            lng: longitude,
            avatarUrl,
            name: userName,
          });
        } else {
          userLocationMarker = mapComponent.value.addMarker(
            latitude,
            longitude
          );
        }

        if (userLocationMarker) {
          userLocationMarker
            .bindPopup(
              `<b>${userName}的位置</b><br>緯度: ${latitude.toFixed(
                6
              )}<br>經度: ${longitude.toFixed(6)}`
            )
            .openPopup();
        }

        // 飛到當前位置
        mapComponent.value.flyTo(latitude, longitude, 15);
      }

      isGettingLocation.value = false;

      // 查詢附近的都更案
      fetchNearbyRenewals(latitude, longitude);
    },
    (error) => {
      isGettingLocation.value = false;

      switch (error.code) {
        case error.PERMISSION_DENIED:
          locationError.value = "您拒絕了位置存取權限";
          break;
        case error.POSITION_UNAVAILABLE:
          locationError.value = "無法取得位置資訊";
          break;
        case error.TIMEOUT:
          locationError.value = "定位請求逾時";
          break;
        default:
          locationError.value = "發生未知錯誤";
      }
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    }
  );
};
// === 取得當前位置功能 end ===

// === 附近都更資料 ===
const nearbyRenewals = ref<NearbyRenewalResult[]>([]);
const nearbyRenewalsMap = ref<Map<string, NearbyRenewalResult>>(new Map());
const renewalMarkersMap = ref<Map<string, L.Marker>>(new Map());

const setNearbyRenewals = (data: NearbyRenewalResult[]) => {
  nearbyRenewals.value = data;
};

const fetchNearbyRenewals = async (lat: number, lng: number) => {
  const response = await useFetchNearbyRenewal(lat, lng);
  if (response?.result) {
    // 使用 Map 追蹤資料,防止重複並更新距離
    response.result.forEach((renewal) => {
      const id = String(
        renewal.id || `${renewal.latitude}_${renewal.longitude}`
      );
      nearbyRenewalsMap.value.set(id, renewal);
    });

    // 轉換為陣列並排序
    const sortedRenewals = Array.from(nearbyRenewalsMap.value.values()).sort(
      (a, b) => (a.distance || 0) - (b.distance || 0)
    );

    setNearbyRenewals(sortedRenewals);
  } else {
    nearbyRenewals.value = [];
  }
};

const updateRenewalsMarker = (renewals: NearbyRenewalResult[]) => {
  if (!mapComponent.value) return;

  // 建立新的 ID 集合
  const newRenewalIds = new Set(
    renewals.map((r) => String(r.id || `${r.latitude}_${r.longitude}`))
  );

  // 移除不再存在的 marker
  renewalMarkersMap.value.forEach((marker, id) => {
    if (!newRenewalIds.has(id)) {
      mapComponent.value.getMap()?.removeLayer(marker);
      renewalMarkersMap.value.delete(id);
    }
  });

  // 添加新的或更新現有的 marker
  renewals.forEach((renewal) => {
    const id = String(renewal.id || `${renewal.latitude}_${renewal.longitude}`);

    if (!renewalMarkersMap.value.has(id)) {
      // 新增 marker
      const marker = mapComponent.value.addMarker(
        renewal.latitude,
        renewal.longitude,
        { title: renewal.stop_name }
      );

      if (marker) {
        renewalMarkersMap.value.set(id, marker);
      }
    }
  });
};

// 使用 debounce 包裝，避免地圖移動時頻繁呼叫 API
const fetchNearbyRenewalsWithDebounce = debounce(fetchNearbyRenewals, 500);

// === 附近都更資料 end ===

// === 取得都更案範圍多邊形 ===
const getRenewalPolygon = async () => {
  const response = await useFetchRenewalPolygon("tucheng.json");

  if (response?.result && mapComponent.value) {
    console.log("Polygon response:", response.result);

    // 清除之前的 polygons
    mapComponent.value.clearPolygons();

    // 將 response.result 轉換為 any 來處理未知的結構
    const polygonData = response.result as any;

    mapComponent.value.addGeoJsonPolygon(polygonData, {
      color: "#3b82f6", // 藍色邊框
      fillColor: "#60a5fa", // 淺藍色填充
      fillOpacity: 0.4,
      weight: 3,
    });
  }
};

// === 搜尋地址 ===
const filteredRenewals = ref<NearbyRenewalResult[]>([]);

const searchAddress = () => {
  const trimmedInput = searchInput.value.trim();

  if (!trimmedInput) {
    return;
  }

  filteredRenewals.value = nearbyRenewals.value
    .filter((renewal) => renewal.stop_name.includes(trimmedInput))
    .sort((a, b) => a.distance - b.distance);
};

watch(
  nearbyRenewals,
  (newRenewals) => {
    // 當 nearbyRenewals 更新時，同步更新 filteredRenewals
    filteredRenewals.value = useCloneDeep(newRenewals).sort(
      (a, b) => a.distance - b.distance
    );
  },
  {
    immediate: true,
  }
);

// 監聽 filteredRenewals 變動，更新地圖上的都更地點標記
watch(
  filteredRenewals,
  (newFilteredRenewals) => {
    updateRenewalsMarker(newFilteredRenewals);
  },
  {
    deep: true,
  }
);

// === 第三方登入 ===
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const FACEBOOK_APP_ID = import.meta.env.VITE_FACEBOOK_APP_ID;
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

const userInfo = ref<any>(null);
const userPictureError = ref(false);
const isBindingFacebook = ref(false);
const showLoginModal = ref(false);

// Alert Modal 狀態
const alertModal = reactive({
  show: false,
  type: "info" as "success" | "error" | "info",
  title: "",
  message: "",
});

// 顯示 Alert
function showAlert(
  message: string,
  type: "success" | "error" | "info" = "info",
  title?: string
) {
  alertModal.message = message;
  alertModal.type = type;
  alertModal.title = title || "";
  alertModal.show = true;
}

// 關閉Alert
function closeAlert() {
  alertModal.show = false;
}

// 監聽 showLoginModal 變化,重新渲染 Google 按鈕
watch(showLoginModal, (newValue) => {
  if (newValue) {
    setTimeout(() => {
      renderGoogleButton();
    }, 100);
  }
});

// 宣告 Facebook SDK
declare global {
  interface Window {
    FB: any;
    FB_APP_ID: string;
  }
}

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
  // 動態載入 Facebook SDK
  if (document.getElementById("facebook-jssdk")) {
    return; // 已載入
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

onMounted(() => {
  // 初始化 Google SDK
  if (typeof google !== "undefined" && GOOGLE_CLIENT_ID) {
    google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleGoogleCredential,
    });
  } else {
    console.error("Google SDK 未載入或 Client ID 未設定");
  }

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
});

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

      // 儲存 JWT token 到 cookie (7天過期)
      Cookies.set("auth_token", data.token, { expires: 7 });
      userInfo.value = data.user;

      // 檢查是否已綁定 Facebook
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
      // 即使登入成功，如果沒有綁定 Facebook 也不顯示 modal
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

        // 如果已有 Google 帳號，則綁定 Facebook
        const token = Cookies.get("auth_token");
        if (token) {
          bindFacebookToAccount(accessToken);
        } else {
          // TODO: 實作純 Facebook 登入邏輯
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
        showAlert("現在您可以使用地圖功能了。", "success", "Facebook 綁定成功");
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
</script>

<style lang="scss" scoped>
.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: #5784ba transparent;

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background-color: #4b74a5;
    border-radius: 4px;
    border: 2px solid transparent;
  }
}
</style>
