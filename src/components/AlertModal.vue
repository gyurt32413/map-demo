<template>
  <Modal :show="show" size="sm" padding="md" @close="handleClose">
    <!-- Icon -->
    <div class="mb-4 flex justify-center">
      <div
        :class="[
          'flex h-16 w-16 items-center justify-center rounded-full',
          type === 'success'
            ? 'bg-green-100'
            : type === 'error'
            ? 'bg-red-100'
            : 'bg-blue-100',
        ]"
      >
        <!-- Success Icon -->
        <svg
          v-if="type === 'success'"
          class="h-8 w-8 text-green-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M5 13l4 4L19 7"
          />
        </svg>
        <!-- Error Icon -->
        <svg
          v-else-if="type === 'error'"
          class="h-8 w-8 text-red-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
        <!-- Info Icon -->
        <svg
          v-else
          class="h-8 w-8 text-blue-600"
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
      </div>
    </div>

    <!-- Title -->
    <h3
      v-if="title"
      class="mb-2 text-center text-lg font-semibold text-gray-800"
    >
      {{ title }}
    </h3>

    <!-- Message -->
    <p class="mb-6 whitespace-pre-line text-center text-sm text-gray-600">
      {{ message }}
    </p>

    <!-- Button -->
    <button
      @click="handleClose"
      :class="[
        'w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-colors',
        type === 'success'
          ? 'bg-green-600 hover:bg-green-700'
          : type === 'error'
          ? 'bg-red-600 hover:bg-red-700'
          : 'bg-blue-600 hover:bg-blue-700',
      ]"
    >
      確定
    </button>
  </Modal>
</template>

<script setup lang="ts">
import Modal from "./Modal.vue";
interface Props {
  show: boolean;
  type?: "success" | "error" | "info";
  title?: string;
  message: string;
}

withDefaults(defineProps<Props>(), {
  type: "info",
  title: "",
});

const emit = defineEmits<{
  close: [];
}>();

function handleClose() {
  emit("close");
}
</script>
