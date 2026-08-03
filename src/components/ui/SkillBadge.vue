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
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(4px);
  transition: all 0.25s ease;
  animation: fadeUp 0.4s ease both;
}
.badge:hover {
  background: rgba(96, 165, 250, 0.12);
  border-color: rgba(96, 165, 250, 0.25);
  color: #93c5fd;
  transform: translateY(-1px);
}
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
