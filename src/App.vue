<script setup lang="ts">
import { RouterView, useRoute } from 'vue-router'
import { onMounted, watch, ref } from 'vue';
import { useThemeStore } from './stores/theme';
import NavBar from '@/components/NavBar/NavBar.vue';
import FooterBar from '@/components/FooterBar/FooterBar.vue';
import BackCanvas from '@/components/background/BackCanvas.vue';

const route = useRoute();
const themeStore = useThemeStore();
const isHomeRoute = ref(route.path === '/');
const backCanvasKey = ref(0); // 用于强制 BackCanvas 重新加载

// 监听路由变化
watch(
  () => route.path,
  (newPath) => {
    const wasHome = isHomeRoute.value;
    isHomeRoute.value = newPath === '/';

    // 如果切换到 Home 页面，增加 key 触发重新加载
    if (!wasHome && isHomeRoute.value) {
      backCanvasKey.value++;
    }
  }
)

// 监听主题变化并应用
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

<template>
  <!-- 上下布局容器 -->
  <div class="u-w-full u-h-full by-theme u-flex u-flex-col">
    <!-- 导航栏：全局唯一 -->
    <NavBar />

    <!-- BackCanvas 背景层（仅在 Home 路由显示） -->
    <div v-if="isHomeRoute" class="back-canvas-wrapper u-absolute u-inset-0 u-z-0 u-pointer-events-none">
      <!-- 使用时间戳确保每次都创建全新的 canvas DOM，避免 WebGL 上下文冲突 -->
      <BackCanvas :key="`bc-${backCanvasKey}-${Date.now()}`" />
    </div>

    <!-- 主内容区域：flex-1 自动填充剩余空间 -->
    <main class="u-flex-1 u-w-full u-relative u-overflow-hidden">
      <!-- 路由视图：根据路由切换不同页面 -->
      <RouterView v-slot="{ Component, route }">
        <!-- 使用 CSS 动画实现页面淡入效果，通过 key 强制重新触发动画 -->
        <div :key="route.path" class="page-fade-in">
          <component :is="Component" />
        </div>
      </RouterView>
    </main>

    <!-- 底部栏 -->
    <FooterBar />
  </div>
</template>

<style>
/* 确保 #app 作为 flex 容器，RouterView 渲染的页面占满全屏 */
#app {
  width: 100%;
  height: 100vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* RouterView 渲染的组件默认占满父容器 */
#app > * {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* BackCanvas wrapper 样式 */
.back-canvas-wrapper {
  /* 确保 BackCanvas 不干扰鼠标事件 */
  pointer-events: none;
}

.back-canvas-wrapper > * {
  pointer-events: auto;
}

/* 路由切换过渡动画 */
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

/* 页面淡入动画 - 用于路由切换 */
.page-fade-in {
  height: 100%;
  animation: fadeIn 0.6s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>
