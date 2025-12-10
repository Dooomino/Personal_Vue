

<template>
  <main class="h-full w-full">
    <!-- 头部区域 -->
    <NavBar />

    <BackCanvas />
  </main>
</template>
<script setup lang="ts">
import BackCanvas from '@/components/background/BackCanvas.vue';
import NavBar from '@/components/NavBar/NavBar.vue';

defineOptions({
  name: 'HomeView',
  components: {
    BackCanvas,
    NavBar,
  },
});

</script>
<style scoped></style>
