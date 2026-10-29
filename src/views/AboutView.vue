<template>
  <div class="about-page">
    <div class="scene-section">
      <AboutContainer />
    </div>
    <div class="content-section">
      <h1 class="page-title">关于我</h1>
      <p class="page-subtitle">{{ summary }}</p>

      <!-- 老站 ABOUT ME 段落 -->
      <div class="intro-block">
        <p v-for="(para, i) in aboutIntro" :key="i" class="intro-para">{{ para }}</p>
      </div>
      <div class="resume-row">
        <a class="page-btn" :href="resumes.cn" target="_blank">简历</a>
        <a class="page-btn" :href="resumes.en" target="_blank">简历(英文)</a>
      </div>

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
import { summary, skills, aboutIntro, resumes } from '@/data/resume'
import AboutContainer from '@/components/main/AboutContainer.vue'
import SkillBadge from '@/components/ui/SkillBadge.vue'
import { motion } from 'motion-v'
</script>

<style scoped>
.about-page {
  height: 100%;
  min-height: 100vh;
  width: 100%;
  overflow: hidden scroll;
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
/* 老站简介段落 + 简历按钮 */
.intro-block {
  margin: 0 0 24px;
}
.intro-para {
  font-size: 14.5px;
  color: var(--text-secondary);
  line-height: 1.85;
  margin: 0 0 14px;
}
.resume-row {
  display: flex;
  gap: 12px;
  margin: 0 0 48px;
}
.page-btn {
  font-size: 13.5px;
  color: var(--text-primary);
  text-decoration: none;
  padding: 10px 26px;
  background: #000;
  border: 1px solid #000;
  border-radius: 999px;
  transition:
    background 0.25s ease,
    color 0.25s ease,
    border-color 0.25s ease;
}
.page-btn:hover {
  background: transparent;
  color: var(--text-primary);
  border-color: var(--glass-border-hover);
}
:root:not(.dark) .page-btn {
  color: #fff;
}
:root:not(.dark) .page-btn:hover {
  color: var(--text-primary);
}
.dark .page-btn {
  background: #fff;
  border-color: #fff;
  color: #111;
}
.dark .page-btn:hover {
  background: transparent;
  color: var(--text-primary);
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
  transition:
    border-color 0.3s,
    background-color 0.3s;
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
