<template>
  <div class="card">
    <h3 class="card-title">{{ project.name }}</h3>
    <p class="card-desc">{{ project.description }}</p>
    <div class="tags">
      <span v-for="tech in project.techStack" :key="tech" class="tag tag--blue">{{ tech }}</span>
    </div>
    <a v-if="project.github" :href="project.github" target="_blank" class="card-link">GitHub →</a>
  </div>
</template>

<script setup lang="ts">
import type { PortfolioProject } from '@/data/resume'
defineProps<{ project: PortfolioProject }>()
</script>

<style scoped>
.card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 24px;
  transition: border-color 0.3s;
}
.card:hover {
  border-color: rgba(255, 255, 255, 0.2);
}
.card-title {
  font-size: 18px;
  font-weight: 600;
  color: #fff;
  margin: 0 0 8px;
}
.card-desc {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  margin: 0 0 16px;
  line-height: 1.6;
}
.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}
.tag {
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}
.tag--blue {
  color: #60a5fa;
  border-color: rgba(96, 165, 250, 0.2);
  background: rgba(96, 165, 250, 0.1);
}
.card-link {
  font-size: 14px;
  color: #60a5fa;
  text-decoration: none;
}
.card-link:hover {
  color: #93c5fd;
}
</style>
