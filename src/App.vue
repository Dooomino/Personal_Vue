<script setup lang="ts">
import { RouterView } from 'vue-router'
import { onMounted, watch } from 'vue';
import { useThemeStore } from './stores/theme';

const themeStore = useThemeStore();

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
  <RouterView />
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
</style>
