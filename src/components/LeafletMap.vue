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

// 儲存 polygon 圖層的參考
const polygonLayers = ref<L.Polygon[]>([])

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
  },
  // 添加 Polygon 到地圖
  addPolygon: (coordinates: [number, number][] | [number, number][][], options?: L.PolylineOptions) => {
    if (map) {
      const defaultOptions: L.PolylineOptions = {
        color: '#3b82f6',      // 藍色邊框
        fillColor: '#60a5fa',  // 淺藍色填充
        fillOpacity: 0.3,      // 填充透明度
        weight: 2,             // 邊框粗細
        ...options
      }
      
      const polygon = L.polygon(coordinates, defaultOptions).addTo(map)
      polygonLayers.value.push(polygon)
      
      // 調整地圖視野以顯示整個 polygon
      map.fitBounds(polygon.getBounds(), { padding: [50, 50] })
      
      return polygon
    }
  },
  // 添加多個 Polygons (GeoJSON 格式)
  addGeoJsonPolygon: (geoJsonData: any, options?: L.PolylineOptions) => {
    if (map) {
      const defaultOptions: L.PolylineOptions = {
        color: '#3b82f6',
        fillColor: '#60a5fa',
        fillOpacity: 0.3,
        weight: 2,
        ...options
      }
      
      const geoJsonLayer = L.geoJSON(geoJsonData, {
        style: defaultOptions,
        onEachFeature: (feature, layer) => {
          // 可以在這裡添加 popup 或其他互動
          if (feature.properties && feature.properties.name) {
            layer.bindPopup(feature.properties.name)
          }
        }
      }).addTo(map)
      
      // 調整地圖視野
      map.fitBounds(geoJsonLayer.getBounds(), { padding: [50, 50] })
      
      return geoJsonLayer
    }
  },
  // 清除所有 Polygons
  clearPolygons: () => {
    if (map) {
      polygonLayers.value.forEach(polygon => {
        map?.removeLayer(polygon)
      })
      polygonLayers.value = []
    }
  },
  // 清除特定 Polygon
  removePolygon: (polygon: L.Polygon) => {
    if (map) {
      map.removeLayer(polygon)
      const index = polygonLayers.value.indexOf(polygon)
      if (index > -1) {
        polygonLayers.value.splice(index, 1)
      }
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