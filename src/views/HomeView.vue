

<template>
  <!-- 上下布局容器 -->
  <div class="h-full w-full by-theme flex flex-col">
    <!-- 导航栏 -->
    <NavBar />
    <!-- 主内容区域：flex-1 自动填充剩余空间 -->
    <main class="flex-1 w-full relative overflow-hidden">
      <!-- 背景层：BackCanvas -->
      <div class="back-canvas absolute inset-0 z-0">
        <BackCanvas />
      </div>
      <!-- 内容层：MainContainer -->
      <Transition name="fade">
        <div v-if="showMainContainer" class="relative z-10 h-full w-full">
          <MainContainer />
        </div>
      </Transition>
    </main>
  </div>
</template>
<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useBroadcastStore } from '@/stores/broadcast';
import BackCanvas from '@/components/background/BackCanvas.vue';
import NavBar from '@/components/NavBar/NavBar.vue';
import MainContainer from '@/components/main/MainContainer.vue';

const broadcastStore = useBroadcastStore();
const showMainContainer = ref(false);

onMounted(() => {
  // 注册 BackCanvas 模块
  broadcastStore.registerModule('BackCanvas', 15000); // 15秒超时

  // 监听所有模块加载完成
  const unwatch = broadcastStore.$subscribe((mutation, state) => {
    if (state.allLoaded && !showMainContainer.value) {
      // 所有模块加载完成后，等待 1 秒再显示
      setTimeout(() => {
        showMainContainer.value = true;
      }, 1000);
      // 取消订阅，避免重复触发
      unwatch();
    }
  });
});

defineOptions({
  name: 'HomeView',
  components: {
    BackCanvas,
    NavBar,
  },
});

</script>
<style scoped>
  .back-canvas {
    filter: blur(3px);
  }

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
