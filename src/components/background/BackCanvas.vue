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
  import { onMounted, ref, shallowRef } from 'vue';
  import type { Component } from 'vue';
  import { useBroadcastStore } from '@/stores/broadcast';

  const broadcastStore = useBroadcastStore();

  const canvasModules = import.meta.glob<{ default: Component }>('./stages/*.vue');

  const TESTING = false
  const isLostFocus = ref(true)
  const loadedComponents = shallowRef<Component[]>([])

  const excludeModules = ['RoomStage']

  // 加载随机组件，带重试机制
  async function loadRandomComponent(maxRetries = 10) {
    const paths = Object.keys(canvasModules)

    for (let i = 0; i < maxRetries; i++) {
      const randomPath = paths[Math.floor(Math.random() * paths.length)]
      try {
        const mod = await canvasModules[randomPath]()
        if (mod.default) {
          // 从路径中提取组件名称（例如：'./stages/RoomStage.vue' -> 'RoomStage'）
          const componentName = randomPath.match(/\/([^/]+)\.vue$/)?.[1] || 'Unknown'

          if (!excludeModules.includes(componentName)) {
            loadedComponents.value = [mod.default]
            console.log(`Loaded component: ${componentName}`)

            // 标记模块加载成功
            broadcastStore.markModuleAsSuccess('BackCanvas', `Loaded ${componentName}`);
            return // 成功加载，退出
          } else {
            console.log(`Excluded component: ${componentName}, retrying... (${i + 1}/${maxRetries})`)
          }
        }
      } catch (e) {
        console.warn(`Failed to load canvas component: ${randomPath}`, e)
      }
    }

    console.warn('Failed to load any component after maximum retries')
    // 即使失败也标记为成功，避免 MainContainer 永远不显示
    broadcastStore.markModuleAsSuccess('BackCanvas', 'Fallback loaded');
  }

  onMounted(() => {
    loadRandomComponent()
  })
</script>

