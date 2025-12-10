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

<style scoped>
</style>