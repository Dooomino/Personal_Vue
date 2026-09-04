<template>
  <div class="about-page">
    <div class="scene-section">
      <AboutContainer />
    </div>
    <div class="content-section">
      <h1 class="page-title">关于我</h1>
      <p class="page-subtitle">{{ summary }}</p>

      <h2 class="section-title">技术栈</h2>
      <div class="skills-grid">
        <motion.div
          v-for="(s, si) in skills"
          :key="s.category"
          class="skill-card"
          :initial="{ opacity: 0, y: 12 }"
          :animate="{ opacity: 1, y: 0 }"
          :transition="{ delay: si * 0.06, type: 'spring', stiffness: 300, damping: 25 }"
          :while-hover="{ borderColor: 'rgba(96, 165, 250, 0.4)', scale: 1.01 }"
        >
          <h3 class="skill-category">{{ s.category }}</h3>
          <div class="tags">
            <SkillBadge v-for="(item, ii) in s.items" :key="item" :skill="item" :delay="ii * 30" />
          </div>
        </motion.div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { summary, skills } from '@/data/resume'
import AboutContainer from '@/components/main/AboutContainer.vue'
import SkillBadge from '@/components/ui/SkillBadge.vue'
import { motion } from 'motion-v'
</script>

<style scoped>
.about-page {
  height: 100%;
  width: 100%;
  overflow: hidden auto;
  position: relative;
  z-index: 1;
}
.scene-section {
  width: 100%;
  height: 50vh;
}
.content-section {
  max-width: 780px;
  margin: 0 auto;
  padding: 32px 28px 80px;
}
.page-title {
  font-size: 32px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 12px;
  letter-spacing: -0.02em;
}
.page-subtitle {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.7;
  margin: 0 0 48px;
  max-width: 600px;
}
.section-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 24px;
}
.skills-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
}
@media (max-width: 640px) {
  .skills-grid { grid-template-columns: 1fr 1fr; }
}
.skill-card {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: 14px;
  padding: 18px;
  transition: border-color 0.3s;
}
.skill-category {
  font-size: 12px;
  font-weight: 600;
  color: var(--primary-color);
  margin: 0 0 12px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.tags { display: flex; flex-wrap: wrap; gap: 6px; }
</style>
