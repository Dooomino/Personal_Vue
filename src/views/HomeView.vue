<template>
  <!-- 根容器：占满父元素 -->
  <div class="h-full w-full">
    <!-- 内容层：MainContainer -->
    <Transition name="fade">
      <div v-if="showMainContainer" class="relative z-10 h-full w-full">
        <MainContainer />
      </div>
    </Transition>
  </div>
</template>
<script setup lang="ts">
import { onMounted, ref } from 'vue';
import MainContainer from '@/components/main/MainContainer.vue';

const showMainContainer = ref(false);

onMounted(() => {
  console.log('[HomeView] onMounted called');

  // 直接显示 MainContainer，不再等待 BackCanvas
  setTimeout(() => {
    showMainContainer.value = true;
    console.log('[HomeView] MainContainer shown');
  }, 1000);
});

defineOptions({
  name: 'HomeView',
});
</script>
<style scoped>
  /* MainContainer 淡入动画 */
  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.5s ease-out;
  }

  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }

  .fade-enter-to,
  .fade-leave-from {
    opacity: 1;
  }
</style>
