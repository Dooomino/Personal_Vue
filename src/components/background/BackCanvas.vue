<template>
  <div
    class="w-full h-full canvas-container"
    :class="{'web-blur': isLostFocus && !TESTING }"
    tabindex="0"
    @focus="isLostFocus = false"
    @blur="isLostFocus = true"
    @click="isLostFocus = false">
    <div class="canvas-conatin">
      <!-- <component
        v-for="(comp, index) in loadedComponents"
        :key="index"
        :is="comp"
      /> -->
      <TextStage />
    </div>

  </div>
</template>
<script setup lang="ts">
  import { onMounted, ref, shallowRef } from 'vue';
  import TextStage from './stages/TextStage.vue';
  const canvasModules = import.meta.glob<{ setup?: Function }>('./stages/*.vue');

  const TESTING = false
  const isLostFocus = ref(true)
  const loadedComponents = shallowRef<any[]>([])

  onMounted(async () => {
    const paths = Object.keys(canvasModules)
    const randomPath = paths[Math.floor(Math.random() * paths.length)]
    try {
      const mod = await canvasModules[randomPath]()
      if (mod.default) {
        loadedComponents.value = [mod.default]
      }
    } catch (e) {
      console.warn(`Failed to load canvas component: ${randomPath}`, e)
    }
  })
</script>

