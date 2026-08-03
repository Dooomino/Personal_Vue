<template>
  <!-- 根容器：占满父元素 -->
  <div class="u-h-full u-w-full">
    <!-- 内容层：MainContainer -->
    <MainContainer />
  </div>
</template>
<script setup lang="ts">
import MainContainer from '@/components/main/MainContainer.vue';

defineOptions({
  name: 'HomeView',
});
</script>
