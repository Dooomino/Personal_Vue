<template>
  <div class="page">
    <div class="content">
      <div class="header fade-in">
        <h1 class="page-title">我的项目</h1>
        <p class="page-subtitle">个人作品与开源贡献</p>
      </div>
      <div class="grid">
        <ProjectCard v-for="(p, i) in portfolioProjects" :key="p.name" :project="p" :index="i" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { portfolioProjects } from '@/data/resume'
import ProjectCard from '@/components/ui/ProjectCard.vue'
</script>

<style scoped>
.page {
  width: 100%;
  height: 100%;
  overflow-y: auto;
  position: relative;
  z-index: 1;
}
.content {
  max-width: 780px;
  margin: 0 auto;
  padding: 56px 28px 80px;
}
.header { margin-bottom: 40px; }
.page-title {
  font-size: 32px;
  font-weight: 700;
  color: #fff;
  margin: 0 0 8px;
  letter-spacing: -0.02em;
}
.page-subtitle {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.4);
  margin: 0;
}
.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}
@media (max-width: 640px) {
  .grid { grid-template-columns: 1fr; }
}
.fade-in { animation: fadeIn 0.6s ease both; }
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
