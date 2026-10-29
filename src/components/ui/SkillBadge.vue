<template>
  <span class="badge" :style="{ animationDelay: `${delay}ms` }">{{ skill }}</span>
</template>

<script setup lang="ts">
defineProps<{ skill: string; delay?: number }>()
</script>

<style scoped>
.badge {
  font-size: 13px;
  padding: 5px 12px;
  border-radius: 6px;
  /* 主题感知：原为深色主题专用白字,浅色主题下白底白字不可读 */
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  color: var(--text-secondary);
  backdrop-filter: blur(4px);
  transition: all 0.25s ease;
  animation: fadeUp 0.4s ease both;
}
.badge:hover {
  background: var(--glass-bg-hover);
  border-color: var(--glass-border-hover);
  color: var(--text-primary);
  transform: translateY(-1px);
}
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
