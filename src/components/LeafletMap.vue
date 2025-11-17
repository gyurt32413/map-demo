<template>
  <div id="map" ref="mapContainer" class="w-full h-full"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// 修復 Leaflet 圖標問題
import icon from 'leaflet/dist/images/marker-icon.png'
import iconShadow from 'leaflet/dist/images/marker-shadow.png'
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png'

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconRetinaUrl: iconRetina,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})
L.Marker.prototype.options.icon = DefaultIcon

const mapContainer = ref<HTMLElement>()
let map: L.Map | null = null

const props = withDefaults(defineProps<{
  center?: [number, number]
  zoom?: number
}>(), {
  center: () => [25.0330, 121.5654], // 台北101
  zoom: 13
})

const emit = defineEmits<{
  mapReady: [map: L.Map]
  click: [event: L.LeafletMouseEvent]
}>()

onMounted(() => {
  if (mapContainer.value) {
    // 初始化地圖
    map = L.map(mapContainer.value, {
      center: props.center,
      zoom: props.zoom,
      zoomControl: true
    })

    // 添加圖磚層 (使用 OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
    }).addTo(map)

    // 添加預設標記
    const marker = L.marker(props.center).addTo(map)
    marker.bindPopup('<b>歡迎使用 Leaflet!</b><br>這是您的地圖標記。').openPopup()

    // 地圖點擊事件
    map.on('click', (e: L.LeafletMouseEvent) => {
      emit('click', e)
    })

    // 發送地圖就緒事件
    emit('mapReady', map)
  }
})

onUnmounted(() => {
  if (map) {
    map.remove()
    map = null
  }
})

// 導出地圖實例供外部使用
defineExpose({
  getMap: () => map,
  addMarker: (lat: number, lng: number, options?: L.MarkerOptions) => {
    if (map) {
      return L.marker([lat, lng], options).addTo(map)
    }
  },
  flyTo: (lat: number, lng: number, zoom?: number) => {
    if (map) {
      map.flyTo([lat, lng], zoom || map.getZoom())
    }
  }
})
</script>

<style scoped>
/* 確保地圖容器有正確的尺寸 */
#map {
  min-height: 100%;
}

/* 修正 Leaflet 控制項在 Tailwind CSS 下的樣式問題 */
:deep(.leaflet-control) {
  font-family: inherit;
}

:deep(.leaflet-popup-content-wrapper) {
  border-radius: 0.5rem;
}
</style>