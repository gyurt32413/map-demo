<template>
  <div class="h-screen">
    <!-- Nav -->
    <nav class="h-14 bg-gray-100 flex items-center px-4 shadow-sm border-b">
      <h1 class="text-xl font-semibold text-gray-800">地圖示範</h1>

      <!-- 登入 -->
      <div class="ml-auto flex items-center space-x-4">
        <template v-if="isEmpty(userInfo)">
          <span class="text-sm text-blue-500 font-semibold"> 登入： </span>
          <div id="google-login"></div>
        </template>

        <template v-else>
          <div class="flex items-center space-x-3">
            <!-- 使用者資訊 -->
            <div class="flex items-center space-x-2">
              <span class="text-sm">HI！{{ userInfo.name }}</span>
              <div
                v-if="userPictureError"
                class="size-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-semibold"
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
              class="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ isBindingFacebook ? "綁定中..." : "綁定 Facebook" }}
            </button>
            <span v-else class="text-xs text-green-600 font-medium">
              ✓ 已綁定 Facebook
            </span>

            <!-- 登出按鈕 -->
            <button
              @click="logout"
              class="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded hover:bg-gray-50"
            >
              登出
            </button>
          </div>
        </template>
      </div>
    </nav>

    <!-- Main -->
    <main class="flex h-[calc(100%-56px)]">
      <!-- Sidebar -->
      <div class="w-[300px] h-full bg-gray-50 border-r overflow-y-auto">
        <div class="p-4">
          <h2 class="text-lg font-semibold mb-4">搜尋地址</h2>

          <!-- 座標輸入 -->
          <div class="space-y-3">
            <div class="flex items-center space-x-2">
              <input
                type="text"
                placeholder="請輸入你要查詢的地址"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                v-model="searchInput"
              />
              <button @click="searchAddress">
                <img src="./assets/search_icon.svg" alt="search-icon" />
              </button>
            </div>
          </div>

          <!-- 附近的都更案 -->
          <div class="mt-6 pt-4 border-t">
            <h3 class="font-medium text-gray-700 mb-2">地圖資訊</h3>
            <ul class="custom-scrollbar max-h-[600px] pr-1 overflow-y-auto">
              <template
                v-for="(renewal, index) in filteredRenewals"
                :key="renewal.id"
              >
                <li
                  class="mb-3 cursor-pointer font-semibold flex justify-between items-center px-2 py-4 bg-white border border-gray-200 rounded-md shadow-sm"
                  @click="getRenewalInfo(renewal)"
                >
                  <div class="text-gray-800 text-[18px]">
                    {{ renewal.stop_name }}
                  </div>

                  <div class="text-sm text-blue-400 space-x-1">
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
      <div class="flex-1 h-full relative">
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
          class="absolute bottom-6 right-6 size-10 bg-white rounded-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center border-2 border-gray-200 hover:border-blue-500 z-[1000]"
        >
          <!-- 瞄準器圖標 -->
          <img src="./assets/locate_icon.svg" alt="Locate Icon" />
        </button>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from "vue";
import LeafletMap from "./components/LeafletMap.vue";
import type L from "leaflet";
import { useFetchNearbyRenewal } from "./api/useFetchNearbyRenewal";
import { useFetchRenewalPolygon } from "./api/useFetchRenewalPolygon";
import { debounce, useCloneDeep, isEmpty } from "./utils/functionUtils";

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

window.onload = () => {
  // 初始化 Google SDK
  if (typeof google !== "undefined" && GOOGLE_CLIENT_ID) {
    google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleGoogleCredential,
    });

    const buttonDiv = document.getElementById("google-login");
    if (buttonDiv) {
      google.accounts.id.renderButton(buttonDiv, {
        theme: "filled_blue",
        size: "medium",
        type: "icon",
      });
    }
  } else {
    console.error("Google SDK 未載入或 Client ID 未設定");
  }

  // 初始化 Facebook SDK
  if (FACEBOOK_APP_ID) {
    initFacebookSDK();
  }

  // 檢查是否有已登入的 token
  const savedToken = localStorage.getItem("auth_token");
  if (savedToken) {
    verifyExistingToken(savedToken);
  }
};

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

      // 儲存 JWT token
      localStorage.setItem("auth_token", data.token);
      userInfo.value = data.user;

      // 更新 UI 狀態（可以建立 user state）
      alert(`歡迎，${data.user.name}！`);

      // 重新整理或更新 UI
      // location.reload();
    } else {
      console.error("❌ 登入失敗:", data.error);
      alert("登入失敗，請重試");
    }
  } catch (error) {
    console.error("❌ 網路錯誤:", error);
    alert("連線失敗，請檢查後端伺服器是否運行");
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
    } else {
      localStorage.removeItem("auth_token");
    }
  } catch (error) {
    console.error("Token 驗證失敗:", error);
    localStorage.removeItem("auth_token");
  }
}

// 綁定 Facebook
function bindFacebook() {
  if (!window.FB) {
    alert("Facebook SDK 尚未載入，請稍後再試");
    return;
  }

  isBindingFacebook.value = true;

  window.FB.login(
    (response: any) => {
      if (response.authResponse) {
        const accessToken = response.authResponse.accessToken;
        console.log("收到 Facebook token，準備綁定...");

        // 使用 Promise 處理非同步操作
        const token = localStorage.getItem("auth_token");
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
              alert("✅ Facebook 綁定成功！");
            } else {
              alert(`❌ 綁定失敗: ${data.error}`);
            }
            isBindingFacebook.value = false;
          })
          .catch((error) => {
            console.error("綁定失敗:", error);
            alert("綁定過程中發生錯誤");
            isBindingFacebook.value = false;
          });
      } else {
        console.log("使用者取消 Facebook 登入");
        isBindingFacebook.value = false;
      }
    },
    { scope: "public_profile" }
  );
}

// 登出
function logout() {
  localStorage.removeItem("auth_token");
  userInfo.value = null;
  userPictureError.value = false;
  alert("已登出");
  location.reload();
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
    background-clip: content-box;
  }
}
</style>
