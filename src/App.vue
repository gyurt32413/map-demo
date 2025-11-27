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
    <Navbar
      :user-info="userInfo"
      :user-picture-error="userPictureError"
      :is-binding-facebook="isBindingFacebook"
      :get-initials="getInitials"
      @bind-facebook="bindFacebook"
      @logout="logout"
      @show-login="showLoginModal = true"
    />

    <!-- Main -->
    <main
      v-if="!isEmpty(userInfo) && userInfo.facebookId"
      class="flex h-[calc(100%-56px)] mobile:flex-col"
    >
      <!-- Sidebar -->
      <Sidebar
        v-model:search-input="searchInput"
        :renewals="filteredRenewals"
        @search="searchAddress"
        @select-renewal="getRenewalInfo"
      />

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
import { reactive, onMounted } from "vue";
import LeafletMap from "./components/LeafletMap.vue";
import AlertModal from "./components/AlertModal.vue";
import LoginModal from "./components/LoginModal.vue";
import Navbar from "./components/Navbar.vue";
import Sidebar from "./components/Sidebar.vue";
import { isEmpty } from "./utils/functionUtils";
import { useMap } from "./composables/useMap";
import { useAuth } from "./composables/useAuth";

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

// 使用 Auth Composable
const {
  userInfo,
  userPictureError,
  isBindingFacebook,
  showLoginModal,
  getInitials,
  bindFacebook,
  logout,
  initAuth,
} = useAuth(showAlert);

// 使用 Map Composable
const {
  mapComponent,
  isGettingLocation,
  locationError,
  searchInput,
  mapCenter,
  filteredRenewals,
  onMapReady,
  onMapClick,
  getRenewalInfo,
  getCurrentLocation,
  searchAddress,
} = useMap(userInfo);

onMounted(() => {
  initAuth();
});
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
