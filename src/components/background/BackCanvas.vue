<template>
  <div
    class="w-full h-full canvas-container"
    :class="{'web-blur': isLostFocus && !TESTING }"
    tabindex="0"
    @focus="isLostFocus = false"
    @blur="isLostFocus = true"
    @click="isLostFocus = false">
    <div class="canvas-conatin">
      <!-- <RoomStage /> -->
      <TerrianStage />
    </div>

  </div>
</template>
<script setup lang="ts">
  import { ref } from 'vue';
  import TerrianStage from './TerrianStage.vue';
  // import RoomStage from './RoomStage.vue';

  const TESTING = false
  const isLostFocus = ref(true)
</script>

