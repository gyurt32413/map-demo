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
          <h2 class="text-lg font-medium mb-4">地圖控制</h2>

          <!-- 座標輸入 -->
          <div class="space-y-3">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1"
                >緯度</label
              >
              <input
                v-model.number="coordinates.lat"
                type="number"
                step="0.000001"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="25.0330"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1"
                >經度</label
              >
              <input
                v-model.number="coordinates.lng"
                type="number"
                step="0.000001"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="121.5654"
              />
            </div>
            <button
              @click="goToLocation"
              class="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors"
            >
              前往位置
            </button>
          </div>

          <!-- 附近的都更案 -->
          <div class="mt-6 pt-4 border-t">
            <h3 class="font-medium text-gray-700 mb-2">地圖資訊</h3>
            <ul class="custom-scrollbar max-h-[600px] pr-1 overflow-y-auto">
              <template
                v-for="(renewal, index) in nearbyRenewals"
                :key="renewal.id"
              >
                <li
                  class="mb-3 cursor-pointer font-semibold flex justify-between items-center px-2 py-4 bg-white border border-gray-200 rounded-md shadow-sm"
                  @click="getRenewalPolygon(renewal)"
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
      <div class="flex-1 h-full">
        <LeafletMap
          ref="mapComponent"
          :center="[coordinates.lat, coordinates.lng]"
          :zoom="13"
          @map-ready="onMapReady"
          @click="onMapClick"
        />
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

let map: L.Map | null = null;
const mapComponent = ref();
const mapZoom = ref(13);

// 響應式資料
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
// === 附近都更資料 end ===

// === 取得都更案範圍多邊形 ===
const getRenewalPolygon = async (renewal: NearbyRenewalResult) => {
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

watch(
  mapCenter,
  (newCenter) => {
    fetchNearbyRenewals(newCenter.lat, newCenter.lng);
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
