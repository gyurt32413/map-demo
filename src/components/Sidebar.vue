<template>
  <div
    class="h-full w-[300px] border-r bg-gray-50 mobile:order-1 mobile:h-1/2 mobile:w-full"
  >
    <div class="p-4">
      <h2 class="mb-4 text-lg font-semibold mobile:hidden">搜尋地址</h2>

      <!-- 地址輸入 -->
      <div class="space-y-3">
        <div class="flex items-center space-x-2">
          <input
            type="text"
            placeholder="請輸入你要查詢的地址"
            class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            :value="searchInput"
            @input="
              $emit(
                'update:searchInput',
                ($event.target as HTMLInputElement).value
              )
            "
          />
          <button @click="$emit('search')">
            <img src="../assets/search_icon.svg" alt="search-icon" />
          </button>
        </div>
      </div>

      <!-- 附近的都更案 -->
      <div class="mt-6 top:border-t mobile:mt-2 tablet:pt-4">
        <h3 class="mb-2 font-medium text-gray-700 mobile:hidden">地圖資訊</h3>
        <ul
          class="custom-scrollbar max-h-[600px] overflow-y-auto pr-1 mobile:max-h-[calc(50vh-120px)]"
        >
          <template v-for="renewal in renewals" :key="renewal.id">
            <li
              class="mb-3 flex cursor-pointer items-center justify-between rounded-md border border-gray-200 bg-white px-2 py-4 font-semibold shadow-sm"
              @click="$emit('select-renewal', renewal)"
            >
              <div class="text-[18px] text-gray-800">
                {{ renewal.stop_name }}
              </div>

              <div class="space-x-1 text-sm text-blue-400">
                <span class="text-[30px]">{{ renewal.distance }}</span>
                <span>km</span>
              </div>
            </li>
          </template>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  searchInput: string;
  renewals: NearbyRenewalResult[];
}

defineProps<Props>();

defineEmits<{
  "update:searchInput": [value: string];
  search: [];
  "select-renewal": [renewal: NearbyRenewalResult];
}>();
</script>

<style scoped>
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
    background-clip: content-box;
  }
}
</style>
