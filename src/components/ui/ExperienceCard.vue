<template>
  <div class="card" :style="{ animationDelay: `${index * 80}ms` }">
    <div class="card-header">
      <div>
        <h3 class="card-title">{{ project.name }}</h3>
        <span class="card-period">{{ project.period }}</span>
      </div>
    </div>
    <ul class="desc-list">
      <li v-for="(desc, i) in project.description" :key="i" class="desc-item">{{ desc }}</li>
    </ul>
    <div class="tags">
      <span v-for="tech in project.techStack" :key="tech" class="tag">{{ tech }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { WorkProject } from '@/data/resume'
defineProps<{ project: WorkProject; index: number }>()
</script>

<style scoped>
.card {
  background: var(--glass-bg);
  backdrop-filter: blur(12px);
  border: 1px solid var(--glass-border);
  border-radius: 16px;
  padding: 28px;
  animation: cardIn 0.5s ease both;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}
.card-title {
  font-size: 17px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 4px;
}
.card-period {
  font-size: 13px;
  color: var(--text-muted);
}
.desc-list {
  list-style: none;
  padding: 0;
  margin: 0 0 16px;
}
.desc-item {
  font-size: 13.5px;
  color: var(--text-secondary);
  line-height: 1.7;
  padding-left: 18px;
  position: relative;
  margin-bottom: 6px;
}
.desc-item::before {
  content: '';
  position: absolute;
  left: 4px;
  top: 9px;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #3b82f6;
}
.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.tag {
  font-size: 11px;
  padding: 3px 9px;
  border-radius: 999px;
  color: #4ade80;
  background: rgba(74, 222, 128, 0.08);
  border: 1px solid rgba(74, 222, 128, 0.15);
}
@keyframes cardIn {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
