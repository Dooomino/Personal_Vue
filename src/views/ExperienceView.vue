<template>
  <div class="page">
    <div class="content">
      <div class="header fade-in">
        <h1 class="page-title">工作经历</h1>
        <p class="page-subtitle">{{ summary }}</p>
      </div>

      <section v-for="(exp, ei) in workExperience" :key="exp.company" class="section fade-in" :style="{ animationDelay: `${(ei + 1) * 100}ms` }">
        <div class="section-header">
          <h2 class="section-title">{{ exp.company }}</h2>
          <span class="badge badge--blue">{{ exp.title }}</span>
          <span class="section-period">{{ exp.period }}</span>
        </div>
        <div class="cards">
          <ExperienceCard v-for="(p, pi) in exp.projects" :key="p.name" :project="p" :index="pi" />
        </div>
      </section>

      <section class="section fade-in" :style="{ animationDelay: `${(workExperience.length + 1) * 100}ms` }">
        <h2 class="section-title">教育背景</h2>
        <div class="edu-card">
          <div class="edu-header">
            <h3 class="edu-school">{{ education.school }}</h3>
            <span class="edu-period">{{ education.period }}</span>
          </div>
          <p class="edu-degree">{{ education.degree }}</p>
          <div class="tags">
            <SkillBadge v-for="(c, ci) in education.courses" :key="c" :skill="c" :delay="ci * 50" />
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
  max-width: 780px;
  margin: 0 auto;
  padding: 56px 28px 80px;
}
.header { margin-bottom: 56px; }
.page-title {
  font-size: 32px;
  font-weight: 700;
  color: #fff;
  margin: 0 0 12px;
  letter-spacing: -0.02em;
}
.page-subtitle {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.45);
  margin: 0;
  line-height: 1.7;
  max-width: 600px;
}
.section { margin-bottom: 56px; }
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
  font-size: 13px;
  color: rgba(255, 255, 255, 0.35);
  margin-left: auto;
}
.badge {
  font-size: 12px;
  padding: 4px 12px;
  border-radius: 999px;
}
.badge--blue {
  color: #60a5fa;
  background: rgba(96, 165, 250, 0.1);
  border: 1px solid rgba(96, 165, 250, 0.2);
}
.cards { display: flex; flex-direction: column; gap: 20px; }
.edu-card {
  background: linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 16px;
  padding: 28px;
}
.edu-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}
.edu-school {
  font-size: 17px;
  font-weight: 600;
  color: #f0f0f0;
  margin: 0;
}
.edu-period { font-size: 13px; color: rgba(255, 255, 255, 0.35); }
.edu-degree {
  font-size: 13.5px;
  color: rgba(255, 255, 255, 0.55);
  margin: 0 0 16px;
}
.tags { display: flex; flex-wrap: wrap; gap: 8px; }
.fade-in { animation: fadeIn 0.6s ease both; }
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
