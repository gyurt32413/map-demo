<template>
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
          <template v-if="requiresFacebookBinding">
            <button
              v-if="!userInfo.facebookId"
              @click="$emit('bind-facebook')"
              :disabled="isBindingFacebook"
              class="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {{ isBindingFacebook ? "綁定中..." : "綁定 Facebook" }}
            </button>
            <span v-else class="text-xs font-medium text-green-600">
              ✓ 已綁定 Facebook
            </span>
          </template>

          <!-- 登出按鈕 -->
          <button
            @click="$emit('logout')"
            class="rounded border border-gray-300 px-3 py-1 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-800"
          >
            登出
          </button>
        </div>
      </template>
      <template v-else>
        <button
          @click="$emit('show-login')"
          class="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
        >
          登入
        </button>
      </template>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { isEmpty } from "../utils/functionUtils";

interface Props {
  userInfo: any;
  userPictureError: boolean;
  isBindingFacebook: boolean;
  getInitials: (name: string) => string;
  requiresFacebookBinding: boolean;
}

defineProps<Props>();

defineEmits<{
  "bind-facebook": [];
  logout: [];
  "show-login": [];
}>();
</script>
