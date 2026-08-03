<template>
  <div class="page">
    <div class="content">
      <h1 class="page-title">我的项目</h1>
      <div class="grid">
        <ProjectCard v-for="p in portfolioProjects" :key="p.name" :project="p" />
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
  max-width: 800px;
  margin: 0 auto;
  padding: 48px 24px;
}
.page-title {
  font-size: 30px;
  font-weight: 700;
  color: #fff;
  margin: 0 0 32px;
}
.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}
@media (max-width: 640px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
</style>
