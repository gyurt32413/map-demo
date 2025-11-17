<script setup lang="ts">
import HelloWorld from './components/HelloWorld.vue'
</script>

<template>
  <div class="min-h-screen bg-gray-100 py-8">
    <div class="max-w-4xl mx-auto px-4">
      <div class="flex justify-center items-center space-x-8 mb-8">
        <a href="https://vite.dev" target="_blank" class="hover:scale-110 transition-transform">
          <img src="/vite.svg" class="logo" alt="Vite logo" />
        </a>
        <a href="https://vuejs.org/" target="_blank" class="hover:scale-110 transition-transform">
          <img src="./assets/vue.svg" class="logo vue" alt="Vue logo" />
        </a>
      </div>
      <div class="bg-white rounded-lg shadow-lg p-6">
        <HelloWorld msg="Vite + Vue" />
      </div>
      
      <!-- Tailwind 測試區塊 -->
      <div class="mt-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
        <h2 class="text-2xl font-bold mb-10">Tailwind CSS 安裝成功！</h2>
        <p class="text-blue-100">您現在可以使用 Tailwind CSS 的所有功能了。</p>
        <div class="mt-4 flex space-x-4">
          <button class="bg-white text-blue-600 px-4 py-2 rounded-md font-medium hover:bg-blue-50 transition-colors">
            按鈕 1
          </button>
          <button class="border border-white text-white px-4 py-2 rounded-md font-medium hover:bg-white hover:text-blue-600 transition-colors">
            按鈕 2
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
