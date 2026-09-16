<template>
  <!-- 上下布局容器 -->
  <div class="app-container">
    <NavBar />

    <!-- BackCanvas 背景层（仅在 Home 路由显示） -->
    <div v-if="isHomeRoute" class="back-canvas-wrapper u-absolute u-inset-0 u-z-0 u-pointer-events-none">
      <BackCanvas :key="`bc-${backCanvasKey}-${Date.now()}`" />
    </div>

    <!-- 主内容区域 -->
    <main class="main-area">
      <RouterView v-slot="{ Component, route }">
        <div :key="route.path" class="page-fade-in">
          <component :is="Component" />
        </div>
      </RouterView>
    </main>

    <!-- 底部栏 -->
    <FooterBar />
  </div>
</template>

<script setup lang="ts">
import { RouterView, useRoute } from 'vue-router'
import { onMounted, watch, ref } from 'vue';
import { useThemeStore } from '@/stores/theme.ts';
import NavBar from '@/components/NavBar/NavBar.vue';
import FooterBar from '@/components/FooterBar/FooterBar.vue';
import BackCanvas from '@/components/background/BackCanvas.vue';

const route = useRoute();
const themeStore = useThemeStore();
const isHomeRoute = ref(route.path === '/');
const backCanvasKey = ref(0);

watch(
  () => route.path,
  (newPath) => {
    const wasHome = isHomeRoute.value;
    isHomeRoute.value = newPath === '/';
    if (!wasHome && isHomeRoute.value) {
      backCanvasKey.value++;
    }
  }
)

watch(
  () => themeStore.isDarkMode,
  () => {
    themeStore.applyThemeClasses();
  }
)

onMounted(() => {
  themeStore.initTheme();
})
</script>

<style>
#app {
  width: 100%;
  height: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
.app-container{
  width: 100%;
  height: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-area {
  flex: 1;
  height: 100vh;
  width: 100%;
  position: relative;
  overflow: visible;
  display: flex;
  flex-direction: column;
}

.page-fade-in {
  flex: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
  animation: fadeIn 0.6s ease-out;
}

.back-canvas-wrapper {
  pointer-events: none;
}

.back-canvas-wrapper > * {
  pointer-events: auto;
}

.page-enter-active,
.page-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.page-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.page-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

.page-enter-to,
.page-leave-from {
  opacity: 1;
  transform: translateY(0);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>
