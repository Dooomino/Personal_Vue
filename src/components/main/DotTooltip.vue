<template>
  <div
    v-if="visible"
    class="dot-tooltip"
    :style="{ left: position.x + 'px', top: position.y + 'px' }"
  >
    <div class="tooltip-content">
      {{ text }}
    </div>
    <div class="tooltip-arrow"></div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  visible: boolean;
  text: string;
  position: { x: number; y: number };
}

defineProps<Props>();
</script>

<style scoped>
.dot-tooltip {
  position: fixed;
  pointer-events: none;
  z-index: 1000;
  transform: translate(-50%, -120%);
}

.tooltip-content {
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 14px;
  white-space: nowrap;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.tooltip-arrow {
  position: absolute;
  bottom: -6px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-top: 6px solid rgba(0, 0, 0, 0.8);
}
</style>
