<template>
  <span class="badge">{{ skill }}</span>
</template>

<script setup lang="ts">
defineProps<{ skill: string }>()
</script>

<style scoped>
.badge {
  font-size: 14px;
  padding: 6px 12px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.8);
}
</style>
