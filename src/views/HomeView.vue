

<template>
  <!-- 上下布局容器 -->
  <div class="h-full w-full by-theme flex flex-col">
    <!-- 导航栏 -->
    <NavBar />
    <!-- 主内容区域：flex-1 自动填充剩余空间 -->
    <main class="flex-1 w-full relative overflow-hidden">
      <!-- 背景层：BackCanvas -->
      <div class="absolute inset-0 z-0">
        <BackCanvas />
      </div>
      <!-- 内容层：MainContainer -->
      <div class="relative z-10 h-full w-full">
        <MainContainer />
      </div>
    </main>
  </div>
</template>
<script setup lang="ts">
import BackCanvas from '@/components/background/BackCanvas.vue';
import NavBar from '@/components/NavBar/NavBar.vue';
import MainContainer from '@/components/main/MainContainer.vue';

defineOptions({
  name: 'HomeView',
  components: {
    BackCanvas,
    NavBar,
  },
});

</script>
<style scoped></style>
