<template>
  <div id="map" ref="mapContainer" class="w-full h-full"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// 修復 Leaflet 圖標問題
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
import iconRetina from "leaflet/dist/images/marker-icon-2x.png";

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconRetinaUrl: iconRetina,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

const mapContainer = ref<HTMLElement>();
let map: L.Map | null = null;

const props = withDefaults(
  defineProps<{
    center?: [number, number];
    zoom?: number;
  }>(),
  {
    center: () => [25.033, 121.5654], // 台北101
    zoom: 13,
  }
);

const emit = defineEmits<{
  mapReady: [map: L.Map];
  click: [event: L.LeafletMouseEvent];
}>();

onMounted(() => {
  if (mapContainer.value) {
    // 初始化地圖
    map = L.map(mapContainer.value, {
      center: props.center,
      zoom: props.zoom,
      zoomControl: true,
    });

    // 添加圖磚層 (使用 OpenStreetMap)
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    // 地圖點擊事件
    map.on("click", (e: L.LeafletMouseEvent) => {
      emit("click", e);
    });

    // 發送地圖就緒事件
    emit("mapReady", map);
  }
});

onUnmounted(() => {
  if (map) {
    map.remove();
    map = null;
  }
});

// 儲存 polygon 和 marker 圖層的參考
const polygonLayers = ref<L.Polygon[]>([]);
const markerLayers = ref<{ marker: L.Marker; type: "renewal" | "user" }[]>([]);

// 創建自訂頭像圖標
const createAvatarIcon = (imageUrl: string, size: number = 40) => {
  return L.divIcon({
    className: "custom-avatar-marker",
    html: `
      <div class="marker-inner">
        <div style="
          width: ${size}px;
          height: ${size}px;
          border-radius: 50%;
          overflow: hidden;
          border: 3px solid #3b82f6;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
          background: white;
        ">
          <img 
            src="${imageUrl}" 
            style="width: 100%; height: 100%; object-fit: cover;"
            onerror="this.onerror=null; this.parentElement.innerHTML='<div style=\"display:flex;align-items:center;justify-content:center;width:100%;height:100%;background:#3b82f6;color:white;font-weight:bold;\">U</div>';"
          />
        </div>
        <div style="
          width: 0;
          height: 0;
          border-left: 8px solid transparent;
          border-right: 8px solid transparent;
          border-top: 12px solid #3b82f6;
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
          filter: drop-shadow(0 2px 2px rgba(0, 0, 0, 0.2));
        "></div>
      </div>
    `,
    iconSize: [size, size + 12],
    iconAnchor: [size / 2, size + 12],
    popupAnchor: [0, -(size + 12)],
  });
};

// 創建都更地點圖標（紅色）
const createRenewalIcon = () => {
  return L.divIcon({
    className: "marker-wrapper",
    html: `
      <div class="marker-inner">
        <img 
          src="data:image/svg+xml;base64,${btoa(`
            <svg xmlns="http://www.w3.org/2000/svg" width="25" height="41" viewBox="0 0 25 41">
              <path fill="#ef4444" stroke="#fff" stroke-width="2" d="M12.5 0C5.6 0 0 5.6 0 12.5c0 8.4 12.5 28.5 12.5 28.5S25 20.9 25 12.5C25 5.6 19.4 0 12.5 0z"/>
              <circle cx="12.5" cy="12.5" r="6" fill="#fff"/>
            </svg>
          `)}"
          style="width: 25px; height: 41px; display: block;"
        />
      </div>
    `,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  });
};

// 導出地圖實例供外部使用
defineExpose({
  getMap: () => map,
  addMarker: (lat: number, lng: number, options?: L.MarkerOptions) => {
    if (map) {
      // 使用紅色都更地點圖標作為預設
      const renewalIcon = createRenewalIcon();
      const mergedOptions = { icon: renewalIcon, ...options };
      const marker = L.marker([lat, lng], mergedOptions).addTo(map);

      markerLayers.value.push({ marker, type: "renewal" });
      return marker;
    }
  },
  // 添加當前位置標記（使用頭像）
  addUserMarker: ({
    lat,
    lng,
    avatarUrl,
    name,
  }: {
    lat: number;
    lng: number;
    avatarUrl: string;
    name?: string;
  }) => {
    if (map) {
      const icon = createAvatarIcon(avatarUrl);
      const marker = L.marker([lat, lng], { icon }).addTo(map);

      if (name) {
        marker.bindPopup(`<b>您的位置</b><br>${name}`);
      }

      markerLayers.value.push({ marker, type: "user" });
      return marker;
    }
  },
  // 讓指定的 marker 跳動
  bounceMarker: (lat: number, lng: number) => {
    if (map) {
      const targetItem = markerLayers.value.find((item) => {
        const markerLatLng = item.marker.getLatLng();
        return (
          Math.abs(markerLatLng.lat - lat) < 0.0001 &&
          Math.abs(markerLatLng.lng - lng) < 0.0001
        );
      });

      if (targetItem) {
        // 抓內層 marker-inner（這一層才能做動畫，不會干擾 Leaflet transform）
        const markerInner = targetItem.marker
          .getElement()
          ?.querySelector(".marker-inner") as HTMLElement;

        if (markerInner) {
          markerInner.classList.remove("marker-bounce");
          void markerInner.offsetWidth; // reset animation
          markerInner.classList.add("marker-bounce");

          setTimeout(() => {
            markerInner.classList.remove("marker-bounce");
          }, 1000);
        }
      }
    }
  },

  // 清除所有 Markers（可選擇性清除類型）
  clearMarkers: (type?: "renewal" | "user") => {
    if (map) {
      if (type) {
        // 只清除指定類型
        markerLayers.value = markerLayers.value.filter((item) => {
          if (item.type === type) {
            map?.removeLayer(item.marker as unknown as L.Layer);
            return false;
          }
          return true;
        });
      } else {
        // 清除所有
        markerLayers.value.forEach((item) => {
          map?.removeLayer(item.marker as unknown as L.Layer);
        });
        markerLayers.value = [];
      }
    }
  },
  // 清除特定 Marker
  removeMarker: (marker: L.Marker) => {
    if (map) {
      map.removeLayer(marker as unknown as L.Layer);
      const index = markerLayers.value.findIndex((item) => item.marker === marker);
      if (index > -1) {
        markerLayers.value.splice(index, 1);
      }
    }
  },
  flyTo: (lat: number, lng: number, zoom?: number) => {
    if (map) {
      map.flyTo([lat, lng], zoom || map.getZoom());
    }
  },
  // 添加 Polygon 到地圖
  addPolygon: (
    coordinates: [number, number][] | [number, number][][],
    options?: L.PolylineOptions
  ) => {
    if (map) {
      const defaultOptions: L.PolylineOptions = {
        color: "#3b82f6", // 藍色邊框
        fillColor: "#60a5fa", // 淺藍色填充
        fillOpacity: 0.3, // 填充透明度
        weight: 2, // 邊框粗細
        ...options,
      };

      const polygon = L.polygon(coordinates, defaultOptions).addTo(map);
      polygonLayers.value.push(polygon);

      // 調整地圖視野以顯示整個 polygon
      map.fitBounds(polygon.getBounds(), { padding: [50, 50] });

      return polygon;
    }
  },
  // 添加多個 Polygons (GeoJSON 格式)
  addGeoJsonPolygon: (geoJsonData: any, options?: L.PolylineOptions) => {
    if (map) {
      const defaultOptions: L.PolylineOptions = {
        color: "#3b82f6",
        fillColor: "#60a5fa",
        fillOpacity: 0.3,
        weight: 2,
        ...options,
      };

      const geoJsonLayer = L.geoJSON(geoJsonData, {
        style: defaultOptions,
        onEachFeature: (feature, layer) => {
          // 可以在這裡添加 popup 或其他互動
          if (feature.properties && feature.properties.name) {
            layer.bindPopup(feature.properties.name);
          }
        },
      }).addTo(map);

      // 調整地圖視野
      map.fitBounds(geoJsonLayer.getBounds(), { padding: [50, 50] });

      return geoJsonLayer;
    }
  },
  // 清除所有 Polygons
  clearPolygons: () => {
    if (map) {
      polygonLayers.value.forEach((polygon) => {
        map?.removeLayer(polygon as unknown as L.Layer);
      });
      polygonLayers.value = [];
    }
  },
  // 清除特定 Polygon
  removePolygon: (polygon: L.Polygon) => {
    if (map) {
      map.removeLayer(polygon as unknown as L.Layer);
      const index = polygonLayers.value.indexOf(polygon);
      if (index > -1) {
        polygonLayers.value.splice(index, 1);
      }
    }
  },
});
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

/* Marker 容器樣式 - 不影響 Leaflet 的 translate3d */
:deep(.marker-wrapper),
:deep(.custom-avatar-marker) {
  background: transparent !important;
  border: none !important;
}

/* Marker 跳動動畫 - 只作用在 inner 層 */
:deep(.marker-inner.marker-bounce) {
  animation: bounce 3s ease-out !important;
}

@keyframes bounce {
  0%,
  100% {
    transform: translateY(0) scale(1);
  }
  10% {
    transform: translateY(-30px) scale(1.05);
  }
  20% {
    transform: translateY(0) scale(1);
  }
  30% {
    transform: translateY(-15px) scale(1.02);
  }
  40% {
    transform: translateY(0) scale(1);
  }
  50% {
    transform: translateY(-8px) scale(1.01);
  }
  60% {
    transform: translateY(0) scale(1);
  }
}
</style>
