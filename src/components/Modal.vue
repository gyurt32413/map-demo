<template>
  <Transition name="modal">
    <div
      v-if="show"
      :class="[
        'fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm',
        zIndexClass,
      ]"
      @click.self="handleBackdropClick"
    >
      <div
        :class="[
          'w-full transform animate-[scale-in_0.2s_ease-out] rounded-2xl bg-white shadow-2xl',
          sizeClass,
          paddingClass,
        ]"
      >
        <slot></slot>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed } from "vue";

interface Props {
  show: boolean;
  size?: "sm" | "md" | "lg";
  padding?: "sm" | "md" | "lg";
  zIndex?: "high" | "higher";
  closeOnBackdrop?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  size: "sm",
  padding: "md",
  zIndex: "higher",
  closeOnBackdrop: true,
});

const emit = defineEmits<{
  close: [];
}>();

const sizeClass = computed(() => {
  const sizes = {
    sm: "max-w-sm",
    md: "max-w-md sm:max-w-sm",
    lg: "max-w-lg sm:max-w-md",
  };
  return sizes[props.size];
});

const paddingClass = computed(() => {
  const paddings = {
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  };
  return paddings[props.padding];
});

const zIndexClass = computed(() => {
  const zIndexes = {
    high: "z-[9999]",
    higher: "z-[10000]",
  };
  return zIndexes[props.zIndex];
});

function handleBackdropClick() {
  if (props.closeOnBackdrop) {
    emit("close");
  }
}
</script>

<style scoped>
/* Modal 淡入淡出動畫 */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

/* Modal 縮放動畫 */
@keyframes scale-in {
  0% {
    opacity: 0;
    transform: scale(0.9);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
