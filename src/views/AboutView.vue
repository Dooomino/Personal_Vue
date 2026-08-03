<template>
  <div class="about-page">
    <!-- 现有 3D 场景保持不变 -->
    <div class="scene-half">
      <AboutContainer />
    </div>

    <!-- 简历内容 -->
    <div class="content-half">
      <div class="content-inner">
        <h1 class="page-title">关于我</h1>
        <p class="page-subtitle">{{ summary }}</p>

        <h2 class="section-title">技术栈</h2>
        <div class="skills-grid">
          <div v-for="s in skills" :key="s.category" class="skill-card">
            <h3 class="skill-category">{{ s.category }}</h3>
            <div class="tags">
              <SkillBadge v-for="item in s.items" :key="item" :skill="item" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { summary, skills } from '@/data/resume'
import AboutContainer from '@/components/main/AboutContainer.vue'
import SkillBadge from '@/components/ui/SkillBadge.vue'
</script>

<style scoped>
.about-page {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}
.scene-half {
  height: 50%;
  flex-shrink: 0;
}
.content-half {
  flex: 1;
  overflow-y: auto;
}
.content-inner {
  max-width: 800px;
  margin: 0 auto;
  padding: 48px 24px;
}
.page-title {
  font-size: 30px;
  font-weight: 700;
  color: #fff;
  margin: 0 0 16px;
}
.page-subtitle {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.6;
  margin: 0 0 48px;
}
.section-title {
  font-size: 20px;
  font-weight: 600;
  color: #fff;
  margin: 0 0 24px;
}
.skills-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}
@media (max-width: 640px) {
  .skills-grid {
    grid-template-columns: 1fr 1fr;
  }
}
.skill-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 16px;
}
.skill-category {
  font-size: 13px;
  font-weight: 600;
  color: #60a5fa;
  margin: 0 0 12px;
}
.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
</style>
