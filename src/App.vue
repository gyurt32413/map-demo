<template>
  <div class="h-screen">
    <!-- Nav -->
    <nav class="h-14 bg-gray-100 flex items-center px-4 shadow-sm border-b">
      <h1 class="text-xl font-semibold text-gray-800">地圖示範</h1>
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
            <!-- <div class="text-sm text-gray-600 space-y-1">
              <p>縮放等級: {{ mapZoom }}</p>
              <p>
                中心點: {{ mapCenter.lat.toFixed(4) }},
                {{ mapCenter.lng.toFixed(4) }}
              </p>
              <p v-if="clickedLocation">
                點擊位置: {{ clickedLocation.lat.toFixed(4) }},
                {{ clickedLocation.lng.toFixed(4) }}
              </p>
            </div> -->
          </div>
        </div>
      </div>

      <!-- Map Container -->
      <div class="flex-1 h-full relative">
        <LeafletMap
          ref="mapComponent"
          :center="[coordinates.lat, coordinates.lng]"
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
import { debounce, useCloneDeep } from "./utils/functionUtils";

let map: L.Map | null = null;
let userLocationMarker: L.Marker | null = null;

// 響應式資料
const mapComponent = ref();
const mapZoom = ref(13);
const isGettingLocation = ref(false);
const locationError = ref<string | null>(null);
const searchInput = ref("");

const coordinates = reactive({
  lat: 25.033,
  lng: 121.5654,
});

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

  // 監聽地圖移動和縮放事件
  map.on("moveend zoomend", () => {
    if (map) {
      const center = map.getCenter();
      setMapCenter(center.lat, center.lng);
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

const goToLocation = () => {
  if (mapComponent.value) {
    mapComponent.value.flyTo(coordinates.lat, coordinates.lng, 15);
  }
};

const getRenewalInfo = (renewal: NearbyRenewalResult) => {
  console.log("Selected renewal info:", renewal);
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
      coordinates.lat = latitude;
      coordinates.lng = longitude;

      // 移除舊的標記
      if (userLocationMarker && map) {
        map.removeLayer(userLocationMarker);
      }

      // 添加當前位置標記
      if (mapComponent.value) {
        userLocationMarker = mapComponent.value.addMarker(latitude, longitude);

        if (userLocationMarker) {
          userLocationMarker
            .bindPopup(
              `<b>您的位置</b><br>緯度: ${latitude.toFixed(
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
const setNearByRenewals = (data: NearbyRenewalResult[]) => {
  nearbyRenewals.value = data;
};

const fetchNearbyRenewals = async (lat: number, lng: number) => {
  const response = await useFetchNearbyRenewal(lat, lng);
  if (response?.result) {
    setNearByRenewals(response.result);
  } else {
    nearbyRenewals.value = [];
  }
};

// 使用 debounce 包裝，避免地圖移動時頻繁呼叫 API
const fetchNearbyRenewalsWithDebounce = debounce(fetchNearbyRenewals, 500);

watch(
  mapCenter,
  (newCenter) => {
    fetchNearbyRenewalsWithDebounce(newCenter.lat, newCenter.lng);
  },
  {
    immediate: true,
  }
);
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

  filteredRenewals.value = nearbyRenewals.value.filter((renewal) =>
    renewal.stop_name.includes(trimmedInput)
  );
};

watch(
  nearbyRenewals,
  (newRenewals) => {
    // 當 nearbyRenewals 更新時，同步更新 filteredRenewals
    filteredRenewals.value = useCloneDeep(newRenewals);
  },
  {
    immediate: true,
  }
);
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
