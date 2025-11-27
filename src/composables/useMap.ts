import { ref, reactive, watch, type Ref } from "vue";
import type L from "leaflet";
import { useFetchNearbyRenewal } from "../api/useFetchNearbyRenewal";
import { useFetchRenewalPolygon } from "../api/useFetchRenewalPolygon";
import { debounce, useCloneDeep } from "../utils/functionUtils";

export function useMap(userInfo: Ref<any>) {
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

  const clickedLocation = ref<{ lat: number; lng: number } | null>(null);
  const nearbyRenewals = ref<NearbyRenewalResult[]>([]);
  const nearbyRenewalsMap = ref<Map<string, NearbyRenewalResult>>(new Map());
  const renewalMarkersMap = ref<Map<string, L.Marker>>(new Map());
  const filteredRenewals = ref<NearbyRenewalResult[]>([]);

  // 設定地圖中心
  const setMapCenter = (lat: number, lng: number) => {
    mapCenter.lat = lat;
    mapCenter.lng = lng;
  };

  // 設定點擊位置
  const setClickedLocation = (lat: number, lng: number) => {
    clickedLocation.value = { lat, lng };
  };

  // 設定附近都更資料
  const setNearbyRenewals = (data: NearbyRenewalResult[]) => {
    nearbyRenewals.value = data;
  };

  // 地圖準備完成
  const onMapReady = (mapInstance: L.Map) => {
    map = mapInstance;

    // 監聽地圖移動事件
    map.on("moveend", () => {
      if (map) {
        const center = map.getCenter();
        setMapCenter(center.lat, center.lng);
        fetchNearbyRenewalsWithDebounce(center.lat, center.lng);
      }
    });

    // 監聽地圖縮放事件
    map.on("zoomend", () => {
      if (map) {
        mapZoom.value = map.getZoom();
      }
    });

    getRenewalPolygon();
  };

  // 地圖點擊事件
  const onMapClick = (event: L.LeafletMouseEvent) => {
    setClickedLocation(event.latlng.lat, event.latlng.lng);
    fetchNearbyRenewals(event.latlng.lat, event.latlng.lng);
  };

  // 取得都更資訊
  const getRenewalInfo = (renewal: NearbyRenewalResult) => {
    console.log("Selected renewal info:", renewal);

    if (mapComponent.value) {
      mapComponent.value.flyTo(renewal.latitude, renewal.longitude, 16);

      setTimeout(() => {
        mapComponent.value.bounceMarker(renewal.latitude, renewal.longitude);
      }, 500);
    }
  };

  // 取得當前位置
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

        mapCenter.lat = latitude;
        mapCenter.lng = longitude;

        if (mapComponent.value) {
          mapComponent.value.clearMarkers("user");
        }

        if (mapComponent.value) {
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

          mapComponent.value.flyTo(latitude, longitude, 15);
        }

        isGettingLocation.value = false;
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

  // 取得附近都更資料
  const fetchNearbyRenewals = async (lat: number, lng: number) => {
    const response = await useFetchNearbyRenewal(lat, lng);
    if (response?.result) {
      response.result.forEach((renewal) => {
        const id = String(
          renewal.id || `${renewal.latitude}_${renewal.longitude}`
        );
        nearbyRenewalsMap.value.set(id, renewal);
      });

      const sortedRenewals = Array.from(nearbyRenewalsMap.value.values()).sort(
        (a, b) => (a.distance || 0) - (b.distance || 0)
      );

      setNearbyRenewals(sortedRenewals);
    } else {
      nearbyRenewals.value = [];
    }
  };

  // 使用 debounce 包裝
  const fetchNearbyRenewalsWithDebounce = debounce(fetchNearbyRenewals, 500);

  // 更新都更標記
  const updateRenewalsMarker = (renewals: NearbyRenewalResult[]) => {
    if (!mapComponent.value) return;

    const newRenewalIds = new Set(
      renewals.map((r) => String(r.id || `${r.latitude}_${r.longitude}`))
    );

    renewalMarkersMap.value.forEach((marker, id) => {
      if (!newRenewalIds.has(id)) {
        mapComponent.value.getMap()?.removeLayer(marker);
        renewalMarkersMap.value.delete(id);
      }
    });

    renewals.forEach((renewal) => {
      const id = String(
        renewal.id || `${renewal.latitude}_${renewal.longitude}`
      );

      if (!renewalMarkersMap.value.has(id)) {
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

  // 取得都更案範圍多邊形
  const getRenewalPolygon = async () => {
    const response = await useFetchRenewalPolygon("tucheng.json");

    if (response?.result && mapComponent.value) {
      console.log("Polygon response:", response.result);

      mapComponent.value.clearPolygons();

      const polygonData = response.result as any;

      mapComponent.value.addGeoJsonPolygon(polygonData, {
        color: "#3b82f6",
        fillColor: "#60a5fa",
        fillOpacity: 0.4,
        weight: 3,
      });
    }
  };

  // 搜尋地址
  const searchAddress = () => {
    const trimmedInput = searchInput.value.trim();

    if (!trimmedInput) {
      return;
    }

    filteredRenewals.value = nearbyRenewals.value
      .filter((renewal) => renewal.stop_name.includes(trimmedInput))
      .sort((a, b) => a.distance - b.distance);
  };

  // 監聽 nearbyRenewals 變化
  watch(
    nearbyRenewals,
    (newRenewals) => {
      filteredRenewals.value = useCloneDeep(newRenewals).sort(
        (a, b) => a.distance - b.distance
      );
    },
    {
      immediate: true,
    }
  );

  // 監聽 filteredRenewals 變化
  watch(
    filteredRenewals,
    (newFilteredRenewals) => {
      updateRenewalsMarker(newFilteredRenewals);
    },
    {
      deep: true,
    }
  );

  return {
    // Refs
    mapComponent,
    mapZoom,
    isGettingLocation,
    locationError,
    searchInput,
    mapCenter,
    clickedLocation,
    nearbyRenewals,
    filteredRenewals,

    // Methods
    onMapReady,
    onMapClick,
    getRenewalInfo,
    getCurrentLocation,
    searchAddress,
  };
}
