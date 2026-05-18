<template>
  <!-- 根容器：占满父元素 -->
  <div class="about h-full w-full flex items-center justify-center">
    <AboutContainer />
  </div>
</template>
<script setup lang="ts">
  import AboutContainer from '@/components/main/AboutContainer.vue';
</script>

<style scoped>
.about {
  /* 确保在所有屏幕尺寸下都占满容器 */
  min-height: 100%;
}
</style>
