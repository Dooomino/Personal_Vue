# Personal Website Resume Content Integration Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Populate Personal_Vue with resume content — work experience, skills, projects, education, contact — using plain scoped CSS, with 3D scenes as full-page backgrounds.

**Architecture:** Add `resume-data.ts` as single source of truth. Add missing pages (Experience, Portfolio, Contact). All pages share a consistent layout: 3D background canvas (fixed) + scrollable content overlay. No Tailwind — all styles via scoped `<style>` blocks.

**Tech Stack:** Vue 3, TypeScript, Naive UI, Pinia, Vue Router, Three.js

---

## Current State

**Personal_Vue repo** (`D:\Projects\Personal_Vue`):
- `src/App.vue` — `BackCanvas` as background on Home, NavBar + RouterView
- `src/views/HomeView.vue` → `MainContainer` (3D cube matrix)
- `src/views/AboutView.vue` → `AboutContainer` (3D dot animation)
- `src/router/index.ts` → only `/` and `/about`
- `src/components/NavBar/NavBar.vue` → Home + About + theme toggle
- Missing: Portfolio, Experience, Contact pages, Footer
- `package.json` has `tailwindcss`, `@tailwindcss/vite`, `postcss`, `autoprefixer` installed

**Resume content:**
- Work: 元道通信 (2024-2026), 3 projects (大模型平台, OA系统, 商机挖掘)
- Skills: Vue 3, TypeScript, Three.js, GLSL, ECharts, Docker, etc.
- Education: Ontario Tech University, CS - Digital Media
- Projects: 个人作品集网站, 太阳系, OpenGL太阳系, 文字故障, 符文生成器

---

## Task 1: Remove Tailwind CSS

**Objective:** Delete Tailwind from the project. Replace config with plain CSS reset.

**Files:**
- Modify: `package.json` — remove `tailwindcss`, `@tailwindcss/vite`, `autoprefixer`, `postcss`
- Modify: `vite.config.ts` — remove `@tailwindcss/vite` plugin
- Delete: `tailwind.config.js`
- Delete: `postcss.config.js`
- Modify: `src/styles/` — add a minimal CSS reset if not present

**Step 1: Remove dependencies**

```bash
cd D:/Projects/Personal_Vue
pnpm remove tailwindcss @tailwindcss/vite autoprefixer postcss
```

**Step 2: Edit vite.config.ts**

Remove the `@tailwindcss/vite` import and plugin entry. Keep everything else.

**Step 3: Delete config files**

```bash
rm tailwind.config.js postcss.config.js
```

**Step 4: Verify build still works**

```bash
pnpm type-check && pnpm build
```

**Step 5: Commit**

```bash
git add -A
git commit -m "chore: remove tailwindcss"
```

---

## Task 2: Create Resume Data Module

**Objective:** Single source of truth for all resume content.

**Files:**
- Create: `src/data/resume.ts`

```typescript
// src/data/resume.ts

export interface WorkProject {
  name: string
  period: string
  description: string[]
  techStack: string[]
}

export interface WorkExperience {
  company: string
  title: string
  period: string
  projects: WorkProject[]
}

export interface SkillCategory {
  category: string
  items: string[]
}

export interface PortfolioProject {
  name: string
  description: string
  techStack: string[]
  github?: string
}

export interface Education {
  school: string
  degree: string
  period: string
  courses: string[]
}

export interface ContactInfo {
  phone: string
  email: string
  github: string
  website: string
  location: string
}

export const contact: ContactInfo = {
  phone: '136-8335-1052',
  email: 'yudi.tao@outlook.com',
  github: 'https://github.com/Dooomino',
  website: 'https://mino.moe',
  location: '北京/朝阳',
}

export const summary =
  '具备 2 年+前端开发经验的全栈开发者，熟练掌握 Vue.js 生态与 TypeScript，主导完成多个企业级 Web 应用的前端架构设计与开发。具备 AI 产品前端开发经验（大模型对话界面、流式交互），熟悉 Node.js 后端服务与 DevOps 部署。注重工程质量、用户体验与代码可维护性。'

export const workExperience: WorkExperience[] = [
  {
    company: '深圳市元道通信技术有限公司',
    title: '前端开发工程师',
    period: '2024 - 2026',
    projects: [
      {
        name: '通信行业大模型应用平台',
        period: '2025 - 2026',
        description: [
          '主导前端对话界面架构设计与开发，基于 Vue 3 + TypeScript 实现响应式对话系统',
          '对接大模型 API 实现 SSE 流式响应展示，支持多轮对话状态管理与会话持久化',
          '实现 Markdown 实时渲染、代码高亮、工具调用结果可视化等富文本交互功能',
        ],
        techStack: ['Vue 3', 'TypeScript', 'Vite', 'SSE', 'Markdown 渲染'],
      },
      {
        name: 'OA 系统及行政办公平台',
        period: '2024 - 2025',
        description: [
          '负责公司内部 OA 系统、行政办公等多个模块的前端架构设计与开发',
          '与后端团队协作完成 RESTful API 接口对接，处理异步请求与大数据量列表渲染优化',
          '对旧代码进行性能优化与重构，提取通用组件提升代码复用率 30%+',
          '负责统一信息平台的数据大屏开发，通过多种图表、数据下钻及实时地图进行可视化展示',
          '负责微信小程序开发，实现跨平台适配',
        ],
        techStack: ['Vue 2/3', 'JavaScript', 'Element UI', '微信小程序'],
      },
      {
        name: '智能商机挖掘系统',
        period: '2024 - 2026',
        description: [
          '设计数据可视化看板，通过 ECharts 实现招标数据的多维度图表展示与交互分析',
          '实现数据筛选、搜索、分页等复杂列表功能，优化大数据量下的渲染性能',
        ],
        techStack: ['Vue 3', 'TypeScript', 'ECharts', 'RESTful API'],
      },
    ],
  },
]

export const skills: SkillCategory[] = [
  { category: '编程语言', items: ['JavaScript', 'TypeScript', 'Python', 'C++'] },
  { category: '前端框架', items: ['Vue 2/3', 'Vite', 'Webpack'] },
  { category: 'UI & 样式', items: ['HTML5', 'CSS3', 'Element UI', '响应式设计'] },
  { category: '状态管理', items: ['Vuex', 'Pinia'] },
  { category: 'Web 技术', items: ['RESTful API', 'WebSocket', 'SSE', 'Axios'] },
  { category: '可视化', items: ['ECharts', 'Canvas', 'SVG', 'WebGL', 'Three.js', 'GLSL'] },
  { category: '小程序', items: ['微信小程序'] },
  { category: 'Node.js', items: ['Express', '中间件开发'] },
  { category: 'DevOps', items: ['Docker', 'Linux', 'Nginx', 'Git'] },
]

export const portfolioProjects: PortfolioProject[] = [
  {
    name: '个人作品集网站',
    description:
      '基于 Vue 3 + TypeScript + Three.js 构建的 3D 交互式个人网站。实现自定义 GLSL 着色器（Toon、Moebius、Waves 等多种风格），完成场景渲染与动态光照效果。',
    techStack: ['Vue 3', 'TypeScript', 'Three.js', 'GLSL', 'Vite'],
    github: 'https://github.com/Dooomino/Personal_Vue',
  },
  {
    name: '太阳系',
    description: '一个使用 Processing 和 P5.js 的太阳系演示。',
    techStack: ['Processing', 'P5.js'],
    github: 'https://github.com/Dooomino/Solar',
  },
  {
    name: 'OpenGL 太阳系演示',
    description: '一个 OpenGL 程序，显示由立方体组成的太阳系，大小和运动比例与现实中的太阳系相似。',
    techStack: ['OpenGL', 'C++'],
    github: 'https://github.com/Dooomino/OpenGL-Solar-System',
  },
  {
    name: '文字故障',
    description: '一个类似于终端的 Glitch 文本图像生成器，基于 HTML5 的 SVG 和 Canvas 构建。',
    techStack: ['HTML5', 'SVG', 'Canvas', 'JavaScript'],
    github: 'https://github.com/Dooomino/Text-Glitch',
  },
  {
    name: '符文生成器',
    description: '一个生成伪随机符文的简单项目。',
    techStack: ['Processing'],
    github: 'https://github.com/Dooomino/rune_generator',
  },
]

export const education: Education = {
  school: '安大略省理工大学（加拿大）',
  degree: '计算机科学 - 数字媒体方向 | 荣誉学士',
  period: '2016.09 - 2022.06',
  courses: ['计算机图形学', '计算机视觉', '机器学习', '人机交互', 'Web 开发', '数据结构与算法'],
}
```

**Verify:** `pnpm type-check` → PASS

**Commit:** `git add src/data/resume.ts && git commit -m "feat: add resume data module"`

---

## Task 3: Create Reusable UI Components

**Objective:** Card and badge components with scoped CSS.

**Files:**
- Create: `src/components/ui/ProjectCard.vue`
- Create: `src/components/ui/SkillBadge.vue`
- Create: `src/components/ui/ExperienceCard.vue`

**ProjectCard.vue**

```vue
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
.card:hover { border-color: rgba(255, 255, 255, 0.2); }
.card-title { font-size: 18px; font-weight: 600; color: #fff; margin: 0 0 8px; }
.card-desc { font-size: 14px; color: rgba(255, 255, 255, 0.7); margin: 0 0 16px; line-height: 1.6; }
.tags { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
.tag {
  font-size: 12px; padding: 4px 10px; border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}
.tag--blue { color: #60a5fa; border-color: rgba(96, 165, 250, 0.2); background: rgba(96, 165, 250, 0.1); }
.tag--green { color: #4ade80; border-color: rgba(74, 222, 128, 0.2); background: rgba(74, 222, 128, 0.1); }
.card-link { font-size: 14px; color: #60a5fa; text-decoration: none; }
.card-link:hover { color: #93c5fd; }
</style>
```

**SkillBadge.vue**

```vue
<template>
  <span class="badge">{{ skill }}</span>
</template>

<script setup lang="ts">
defineProps<{ skill: string }>()
</script>

<style scoped>
.badge {
  font-size: 14px; padding: 6px 12px; border-radius: 8px;
  background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.8);
}
</style>
```

**ExperienceCard.vue**

```vue
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
.card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
.card-title { font-size: 18px; font-weight: 600; color: #fff; margin: 0; }
.card-period { font-size: 14px; color: rgba(255, 255, 255, 0.5); }
.desc-list { list-style: none; padding: 0; margin: 0 0 16px; }
.desc-item {
  font-size: 14px; color: rgba(255, 255, 255, 0.7); line-height: 1.6;
  padding-left: 16px; position: relative; margin-bottom: 8px;
}
.desc-item::before { content: '•'; position: absolute; left: 0; color: #60a5fa; }
.tags { display: flex; flex-wrap: wrap; gap: 8px; }
.tag {
  font-size: 12px; padding: 4px 10px; border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}
.tag--green { color: #4ade80; border-color: rgba(74, 222, 128, 0.2); background: rgba(74, 222, 128, 0.1); }
</style>
```

**Verify:** `pnpm type-check` → PASS

**Commit:** `git add src/components/ui/ && git commit -m "feat: add UI components (ProjectCard, SkillBadge, ExperienceCard)"`

---

## Task 4: Create Experience Page

**Objective:** Work experience + education, scrollable over 3D background.

**Files:**
- Create: `src/views/ExperienceView.vue`
- Modify: `src/router/index.ts`

**Step 1: Add route to router**

```typescript
{
  path: '/experience',
  name: 'experience',
  component: () => import('../views/ExperienceView.vue'),
},
```

**Step 2: Create ExperienceView.vue**

```vue
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
.page { width: 100%; height: 100%; overflow-y: auto; position: relative; z-index: 1; }
.content { max-width: 800px; margin: 0 auto; padding: 48px 24px; }
.page-title { font-size: 30px; font-weight: 700; color: #fff; margin: 0 0 8px; }
.page-subtitle { font-size: 14px; color: rgba(255, 255, 255, 0.5); margin: 0 0 48px; line-height: 1.6; }
.section { margin-bottom: 48px; }
.section-header { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; flex-wrap: wrap; }
.section-title { font-size: 20px; font-weight: 600; color: #fff; margin: 0; }
.section-period { font-size: 14px; color: rgba(255, 255, 255, 0.5); margin-left: auto; }
.cards { display: flex; flex-direction: column; gap: 24px; }
.card {
  background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 24px;
}
.card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
.card-title { font-size: 18px; font-weight: 600; color: #fff; margin: 0; }
.card-period { font-size: 14px; color: rgba(255, 255, 255, 0.5); }
.card-desc { font-size: 14px; color: rgba(255, 255, 255, 0.7); margin: 0 0 12px; }
.tags { display: flex; flex-wrap: wrap; gap: 8px; }
.tag { font-size: 12px; padding: 4px 10px; border-radius: 999px; border: 1px solid rgba(255, 255, 255, 0.1); }
.tag--blue { color: #60a5fa; border-color: rgba(96, 165, 250, 0.2); background: rgba(96, 165, 250, 0.1); }
</style>
```

**Verify:** `pnpm type-check` → PASS

**Commit:** `git add src/views/ExperienceView.vue src/router/index.ts && git commit -m "feat: add Experience page"`

---

## Task 5: Create Portfolio Page

**Objective:** Project cards grid.

**Files:**
- Create: `src/views/PortfolioView.vue`
- Modify: `src/router/index.ts`

**Step 1: Add route**

```typescript
{
  path: '/portfolio',
  name: 'portfolio',
  component: () => import('../views/PortfolioView.vue'),
},
```

**Step 2: Create PortfolioView.vue**

```vue
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
.page { width: 100%; height: 100%; overflow-y: auto; position: relative; z-index: 1; }
.content { max-width: 800px; margin: 0 auto; padding: 48px 24px; }
.page-title { font-size: 30px; font-weight: 700; color: #fff; margin: 0 0 32px; }
.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
@media (max-width: 640px) { .grid { grid-template-columns: 1fr; } }
</style>
```

**Verify:** `pnpm type-check` → PASS

**Commit:** `git add src/views/PortfolioView.vue src/router/index.ts && git commit -m "feat: add Portfolio page"`

---

## Task 6: Create Contact Page

**Objective:** Contact info cards.

**Files:**
- Create: `src/views/ContactView.vue`
- Modify: `src/router/index.ts`

**Step 1: Add route**

```typescript
{
  path: '/contact',
  name: 'contact',
  component: () => import('../views/ContactView.vue'),
},
```

**Step 2: Create ContactView.vue**

```vue
<template>
  <div class="page">
    <div class="center">
      <div class="card">
        <h1 class="card-title">联系我</h1>
        <p class="card-subtitle">期待与你的交流</p>
        <div class="list">
          <a :href="`mailto:${contact.email}`" class="item">
            <span class="item-icon">✉️</span>
            <div>
              <div class="item-label">邮箱</div>
              <div class="item-value">{{ contact.email }}</div>
            </div>
          </a>
          <a :href="contact.github" target="_blank" class="item">
            <span class="item-icon">🐙</span>
            <div>
              <div class="item-label">GitHub</div>
              <div class="item-value">Dooomino</div>
            </div>
          </a>
          <div class="item">
            <span class="item-icon">📍</span>
            <div>
              <div class="item-label">位置</div>
              <div class="item-value">{{ contact.location }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { contact } from '@/data/resume'
</script>

<style scoped>
.page { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; position: relative; z-index: 1; }
.center { width: 100%; max-width: 420px; padding: 24px; }
.card {
  background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 16px; padding: 32px; text-align: center;
}
.card-title { font-size: 24px; font-weight: 700; color: #fff; margin: 0 0 8px; }
.card-subtitle { font-size: 14px; color: rgba(255, 255, 255, 0.5); margin: 0 0 32px; }
.list { display: flex; flex-direction: column; gap: 16px; }
.item {
  display: flex; align-items: center; gap: 12px; padding: 16px; border-radius: 12px;
  background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1);
  text-decoration: none; transition: border-color 0.3s;
}
.item:hover { border-color: rgba(255, 255, 255, 0.2); }
.item-icon { font-size: 20px; }
.item-label { font-size: 12px; color: rgba(255, 255, 255, 0.5); }
.item-value { font-size: 14px; color: #fff; }
</style>
```

**Verify:** `pnpm type-check` → PASS

**Commit:** `git add src/views/ContactView.vue src/router/index.ts && git commit -m "feat: add Contact page"`

---

## Task 7: Update NavBar

**Objective:** Add all page links, Chinese labels.

**Files:**
- Modify: `src/components/NavBar/NavBar.vue`

Replace the nav links section. Keep the existing theme toggle. All text in Chinese.

```vue
<template>
  <div class="navbar">
    <div class="navbar-left">
      <router-link to="/" class="navbar-brand">陶雨迪</router-link>
      <nav class="navbar-links">
        <router-link to="/">主页</router-link>
        <router-link to="/experience">经历</router-link>
        <router-link to="/portfolio">项目</router-link>
        <router-link to="/about">关于</router-link>
        <router-link to="/contact">联系</router-link>
      </nav>
    </div>
    <div class="navbar-right">
      <!-- 保留现有 theme toggle -->
      <n-switch :rail-style="railStyle" v-model:value="checked" @update:value="onUpdateChecked">
        <template #checked-icon><n-icon :component="Moon" /></template>
        <template #unchecked-icon><n-icon :component="Sun" /></template>
      </n-switch>
    </div>
  </div>
</template>
```

Add scoped styles (replace existing `<style scoped>`):

```css
.navbar {
  width: 100%; height: 64px; padding: 0 16px; display: flex;
  align-items: center; justify-content: space-between; flex-shrink: 0;
  background: rgba(0, 0, 0, 0.6); backdrop-filter: blur(8px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05); z-index: 50;
}
.navbar-left { display: flex; align-items: center; gap: 24px; }
.navbar-brand { font-size: 18px; font-weight: 600; color: #fff; text-decoration: none; }
.navbar-links { display: flex; gap: 16px; }
.navbar-links a {
  font-size: 14px; color: rgba(255, 255, 255, 0.6); text-decoration: none;
  transition: color 0.3s;
}
.navbar-links a:hover,
.navbar-links a.router-link-exact-active { color: #60a5fa; }
```

**Verify:** `pnpm type-check` → PASS

**Commit:** `git add src/components/NavBar/NavBar.vue && git commit -m "feat: update NavBar with all page links"`

---

## Task 8: Make 3D Scenes Full-Page Backgrounds

**Objective:** Each page renders its 3D canvas as a fixed background, with content scrolling on top.

**Files:**
- Modify: `src/views/AboutView.vue` — keep `AboutContainer`, add scrollable content below

**AboutView.vue** — 3D scene on top half, scrollable content below:

```vue
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
.about-page { width: 100%; height: 100%; display: flex; flex-direction: column; }
.scene-half { height: 50%; flex-shrink: 0; }
.content-half { flex: 1; overflow-y: auto; }
.content-inner { max-width: 800px; margin: 0 auto; padding: 48px 24px; }
.page-title { font-size: 30px; font-weight: 700; color: #fff; margin: 0 0 16px; }
.page-subtitle { font-size: 14px; color: rgba(255, 255, 255, 0.7); line-height: 1.6; margin: 0 0 48px; }
.section-title { font-size: 20px; font-weight: 600; color: #fff; margin: 0 0 24px; }
.skills-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
@media (max-width: 640px) { .skills-grid { grid-template-columns: 1fr 1fr; } }
.skill-card {
  background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px; padding: 16px;
}
.skill-category { font-size: 13px; font-weight: 600; color: #60a5fa; margin: 0 0 12px; }
.tags { display: flex; flex-wrap: wrap; gap: 8px; }
</style>
```

**Verify:** `pnpm type-check` → PASS

**Commit:** `git add src/views/AboutView.vue && git commit -m "feat: add skills content below 3D scene on About page"`

---

## Task 9: Add Footer

**Files:**
- Create: `src/components/FooterBar/FooterBar.vue`
- Modify: `src/App.vue`

**FooterBar.vue**

```vue
<template>
  <footer class="footer">
    <p>© {{ year }} 陶雨迪 · <a href="https://github.com/Dooomino/Personal_Vue" target="_blank">源码</a></p>
  </footer>
</template>

<script setup lang="ts">
const year = new Date().getFullYear()
</script>

<style scoped>
.footer {
  text-align: center; padding: 16px; font-size: 13px;
  color: rgba(255, 255, 255, 0.4); border-top: 1px solid rgba(255, 255, 255, 0.05);
}
.footer a { color: rgba(255, 255, 255, 0.4); text-decoration: none; }
.footer a:hover { color: #60a5fa; }
</style>
```

**App.vue** — add `<FooterBar />` after `</main>`, import it.

**Verify:** `pnpm type-check` → PASS

**Commit:** `git add src/components/FooterBar/FooterBar.vue src/App.vue && git commit -m "feat: add global footer"`

---

## Task 10: Final Build Verification

```bash
cd D:/Projects/Personal_Vue
pnpm type-check && pnpm build
```

Expected: PASS. Fix any issues, commit.

---

## Files Summary

| Action | File |
|--------|------|
| Modify | `package.json` |
| Modify | `vite.config.ts` |
| Delete | `tailwind.config.js`, `postcss.config.js` |
| Create | `src/data/resume.ts` |
| Create | `src/components/ui/ProjectCard.vue` |
| Create | `src/components/ui/SkillBadge.vue` |
| Create | `src/components/ui/ExperienceCard.vue` |
| Create | `src/views/ExperienceView.vue` |
| Create | `src/views/PortfolioView.vue` |
| Create | `src/views/ContactView.vue` |
| Create | `src/components/FooterBar/FooterBar.vue` |
| Modify | `src/router/index.ts` |
| Modify | `src/components/NavBar/NavBar.vue` |
| Modify | `src/views/AboutView.vue` |
| Modify | `src/App.vue` |

## Risks

- **Existing 3D scenes preserved**: MainContainer cube matrix, AboutContainer dot animation, BackCanvas all untouched.
- **About page layout**: 50/50 split — 3D scene top, scrollable content bottom. Ratio adjustable.
- **No portfolio images**: Add later if needed.
- **Old Personal_Web untouched**: Only Personal_Vue is modified.
