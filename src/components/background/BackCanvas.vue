<template>
  <div
    class="w-full h-full canvas-container"
    :class="{'web-blur': isLostFocus && !TESTING }"
    tabindex="0"
    @focus="isLostFocus = false"
    @blur="isLostFocus = true"
    @click="isLostFocus = false">
    <div class="canvas-conatin">
      <component
        v-for="(comp, index) in loadedComponents"
        :key="index"
        :is="comp"
      />
      <!-- <TextStage /> -->
    </div>

  </div>
</template>
<script setup lang="ts">
  import { onMounted, onUnmounted, ref, shallowRef } from 'vue';
  import type { Component } from 'vue';
  import { useBroadcastStore } from '@/stores/broadcast';

  const broadcastStore = useBroadcastStore();

  const canvasModules = import.meta.glob<{ default: Component }>('./stages/*.vue');

  const TESTING = false
  const isLostFocus = ref(true)
  const loadedComponents = shallowRef<Component[]>([])

  const excludeModules = ['RoomStage']

  console.log('[BackCanvas] Component created');

  // 加载随机组件，带重试机制
  async function loadRandomComponent(maxRetries = 10) {
    console.log('[BackCanvas] Starting to load random component...');
    const paths = Object.keys(canvasModules)
    console.log('[BackCanvas] Available modules:', paths);

    for (let i = 0; i < maxRetries; i++) {
      const randomPath = paths[Math.floor(Math.random() * paths.length)]
      try {
        console.log(`[BackCanvas] Attempting to load: ${randomPath}`);
        const mod = await canvasModules[randomPath]()
        if (mod.default) {
          // 从路径中提取组件名称（例如：'./stages/RoomStage.vue' -> 'RoomStage'）
          const componentName = randomPath.match(/\/([^/]+)\.vue$/)?.[1] || 'Unknown'

          if (!excludeModules.includes(componentName)) {
            console.log(`[BackCanvas] Successfully loaded: ${componentName}`);
            loadedComponents.value = [mod.default]
            console.log(`[BackCanvas] Loaded component: ${componentName}`)

            // 标记模块加载成功
            broadcastStore.markModuleAsSuccess('BackCanvas', `Loaded ${componentName}`);
            return // 成功加载，退出
          } else {
            console.log(`[BackCanvas] Excluded component: ${componentName}, retrying... (${i + 1}/${maxRetries})`)
          }
        }
      } catch (e) {
        console.warn(`[BackCanvas] Failed to load canvas component: ${randomPath}`, e)
      }
    }

    console.warn('[BackCanvas] Failed to load any component after maximum retries')
    // 即使失败也标记为成功，避免 MainContainer 永远不显示
    broadcastStore.markModuleAsSuccess('BackCanvas', 'Fallback loaded');
  }

  onMounted(() => {
    console.log('[BackCanvas] onMounted called, key will trigger recreation');

    // 注册 BackCanvas 模块（设置较短的超时时间，因为加载很快）
    broadcastStore.registerModule('BackCanvas', 5000);

    loadRandomComponent()
  });

  onUnmounted(() => {
    console.log('[BackCanvas] onUnmounted called, clearing components');
    loadedComponents.value = [];
  });
</script>

<style scoped>
  .canvas-container {
    position: relative;
    width: 100%;
    height: 100%;
    pointer-events: none;
    filter: blur(3px);
  }
</style>
