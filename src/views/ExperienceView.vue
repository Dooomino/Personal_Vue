<template>
  <div class="page">
    <div class="content">
      <h1 class="page-title">工作经历</h1>
      <p class="page-subtitle">{{ summary }}</p>

      <section v-for="exp in workExperience" :key="exp.company" class="section">
        <div class="section-header">
          <h2 class="section-title">{{ exp.company }}</h2>
          <span class="tag tag--blue">{{ exp.title }}</span>
          <span class="section-period">{{ exp.period }}</span>
        </div>
        <div class="cards">
          <ExperienceCard v-for="p in exp.projects" :key="p.name" :project="p" />
        </div>
      </section>

      <section class="section">
        <h2 class="section-title">教育背景</h2>
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">{{ education.school }}</h3>
            <span class="card-period">{{ education.period }}</span>
          </div>
          <p class="card-desc">{{ education.degree }}</p>
          <div class="tags">
            <SkillBadge v-for="c in education.courses" :key="c" :skill="c" />
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { workExperience, summary, education } from '@/data/resume'
import ExperienceCard from '@/components/ui/ExperienceCard.vue'
import SkillBadge from '@/components/ui/SkillBadge.vue'
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
  margin: 0 0 8px;
}
.page-subtitle {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
  margin: 0 0 48px;
  line-height: 1.6;
}
.section {
  margin-bottom: 48px;
}
.section-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}
.section-title {
  font-size: 20px;
  font-weight: 600;
  color: #fff;
  margin: 0;
}
.section-period {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
  margin-left: auto;
}
.cards {
  display: flex;
  flex-direction: column;
  gap: 24px;
}
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
  margin-bottom: 12px;
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
.card-desc {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  margin: 0 0 12px;
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
.tag--blue {
  color: #60a5fa;
  border-color: rgba(96, 165, 250, 0.2);
  background: rgba(96, 165, 250, 0.1);
}
</style>
