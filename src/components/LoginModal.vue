<template>
  <Modal
    :show="show"
    size="md"
    padding="lg"
    :close-on-backdrop="false"
    z-index="high"
    @close="handleClose"
  >
    <div class="mb-6 text-center">
      <h2 class="mb-2 text-2xl font-bold text-gray-800">歡迎使用地圖系統</h2>
      <p class="text-sm text-gray-600">請登入以查看地圖資訊</p>
    </div>

    <div class="space-y-4">
      <!-- Google 登入按鈕容器 -->
      <div class="flex justify-center">
        <div :id="buttonId"></div>
      </div>

      <p class="text-center text-xs text-gray-500">
        登入即表示您同意我們的服務條款和隱私政策
      </p>
    </div>
  </Modal>
</template>

<script setup lang="ts">
import Modal from "./Modal.vue";

interface Props {
  show: boolean;
  buttonId?: string;
}

withDefaults(defineProps<Props>(), {
  buttonId: "google-login-modal",
});

const emit = defineEmits<{
  close: [];
}>();

function handleClose() {
  emit("close");
}
</script>
