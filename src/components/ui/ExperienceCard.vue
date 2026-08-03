<template>
  <div class="card">
    <div class="card-header">
      <h3 class="card-title">{{ project.name }}</h3>
      <span class="card-period">{{ project.period }}</span>
    </div>
    <ul class="desc-list">
      <li v-for="(desc, i) in project.description" :key="i" class="desc-item">{{ desc }}</li>
    </ul>
    <div class="tags">
      <span v-for="tech in project.techStack" :key="tech" class="tag tag--green">{{ tech }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { WorkProject } from '@/data/resume'
defineProps<{ project: WorkProject }>()
</script>

<style scoped>
.card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 24px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}
.card-title {
  font-size: 18px;
  font-weight: 600;
  color: #fff;
  margin: 0;
}
.card-period {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
}
.desc-list {
  list-style: none;
  padding: 0;
  margin: 0 0 16px;
}
.desc-item {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.6;
  padding-left: 16px;
  position: relative;
  margin-bottom: 8px;
}
.desc-item::before {
  content: '•';
  position: absolute;
  left: 0;
  color: #60a5fa;
}
.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.tag {
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}
.tag--green {
  color: #4ade80;
  border-color: rgba(74, 222, 128, 0.2);
  background: rgba(74, 222, 128, 0.1);
}
</style>
