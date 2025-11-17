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
              <label class="block text-sm font-medium text-gray-700 mb-1">緯度</label>
              <input
                v-model.number="coordinates.lat"
                type="number"
                step="0.000001"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="25.0330"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">經度</label>
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

          <!-- 地圖資訊 -->
          <div class="mt-6 pt-4 border-t">
            <h3 class="text-sm font-medium text-gray-700 mb-2">地圖資訊</h3>
            <div class="text-sm text-gray-600 space-y-1">
              <p>縮放等級: {{ mapZoom }}</p>
              <p>中心點: {{ mapCenter.lat.toFixed(4) }}, {{ mapCenter.lng.toFixed(4) }}</p>
              <p v-if="clickedLocation">
                點擊位置: {{ clickedLocation.lat.toFixed(4) }}, {{ clickedLocation.lng.toFixed(4) }}
              </p>
            </div>
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
import { ref, reactive } from 'vue'
import LeafletMap from './components/LeafletMap.vue'
import type L from 'leaflet'

const mapComponent = ref()
let map: L.Map | null = null

// 響應式資料
const coordinates = reactive({
  lat: 25.0330,
  lng: 121.5654
})

const mapZoom = ref(13)
const mapCenter = reactive({
  lat: 25.0330,
  lng: 121.5654
})
const clickedLocation = ref<{lat: number, lng: number} | null>(null)

// 地圖事件處理
const onMapReady = (mapInstance: L.Map) => {
  map = mapInstance
  
  // 監聽地圖移動和縮放事件
  map.on('moveend zoomend', () => {
    if (map) {
      const center = map.getCenter()
      mapCenter.lat = center.lat
      mapCenter.lng = center.lng
      mapZoom.value = map.getZoom()
    }
  })
}

const onMapClick = (event: L.LeafletMouseEvent) => {
  clickedLocation.value = {
    lat: event.latlng.lat,
    lng: event.latlng.lng
  }
  console.log('地圖點擊:', event.latlng)
}

const goToLocation = () => {
  if (mapComponent.value) {
    mapComponent.value.flyTo(coordinates.lat, coordinates.lng, 15)
  }
}
</script>

<style scoped></style>
