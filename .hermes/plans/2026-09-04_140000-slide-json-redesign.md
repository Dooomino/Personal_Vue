# Slide JSON + Single Component Redesign

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Eliminate 12 identical slide components by making slide data pure JSON and rendering everything through one parameterized ThreeStage component.

**Architecture:** Slide data becomes a JSON array with variant/render config. One `ThreeStage.vue` reads the JSON and renders: canvas gradient (useSlideCanvas) + THREE.js scene (createThreeScene) + HTML overlay (SlideContent). Canvas is owned by SlideReveal (sibling of motion.div). No inject Map — SlideReveal provides canvasRef directly.

**Tech Stack:** Vue 3, Three.js, gsap, motion-v, TypeScript

---

## Context / Assumptions

- `resume.ts` already has `portfolioProjects: PortfolioProject[]` — typed JSON data
- `index.ts` maps 13 project names to 13 async Vue components — 12 are identical
- SlideContent renders HTML overlay (title, desc, tags, links) — this stays (HTML is the right tool for text)
- Canvas gradient animation lives in useSlideCanvas — this stays
- THREE.js scene setup lives in createThreeScene — this stays
- **NOT changing to full WebGL text rendering** — that would require troika-three-text, font loading, raycasting for links. HTML overlay is the correct architecture.

---

## Task 1: Extend PortfolioProject with slide config

**Objective:** Add `variant` and optional `render` callback to the JSON data structure.

**Files:**
- Modify: `src/data/resume.ts`

**Step 1: Update PortfolioProject interface**

```ts
export interface PortfolioProject {
  name: string
  description: string
  techStack: string[]
  github?: string
  demo?: string
  variant?: 'fade-up' | 'fade-left' | 'scale' | 'blur' | 'none'
}
```

**Step 2: Add variant to each project in portfolioProjects**

```ts
export const portfolioProjects: PortfolioProject[] = [
  {
    name: '个人作品集网站',
    description: '...',
    techStack: ['Vue 3', 'TypeScript', 'Three.js', 'GLSL', 'Vite'],
    github: 'https://github.com/Dooomino/Personal_Vue',
    variant: 'scale',  // custom THREE.js render
  },
  {
    name: 'MagicCircle',
    description: '...',
    techStack: ['Processing', 'JavaScript', 'Canvas'],
    github: 'https://github.com/Dooomino/MagicCircle',
    demo: 'https://dooomino.github.io/MagicCircle/',
    variant: 'fade-left',
  },
  // ... all other projects with their variants
]
```

Variant mapping (from current index.ts cycling):
- fade-up: CellularAutomata, FlockingBoids, Solar
- fade-left: FlightSim, MagicCircle, RuneGenerator
- scale: GPUASCII, Stereoscopic, TextGlitch, 个人作品集网站
- blur: ObjViewer, OpenGLSolar, WebGLCube

**Step 3: Verify** — `npx vue-tsc --noEmit` passes

**Step 4: Commit** — `git commit -m "feat: add variant to PortfolioProject JSON"`

---

## Task 2: Create ThreeStage.vue — single parameterized slide

**Objective:** One component that handles canvas gradient + THREE.js + SlideContent, driven by JSON data.

**Files:**
- Create: `src/views/portfolio/slides/ThreeStage.vue`

**Step 1: Create ThreeStage.vue**

```vue
<template>
  <SlideContent
    :project="project"
    :container="container"
    :is-last="isLast"
    :animated="animated"
    :variant="project.variant ?? 'fade-up'"
  />
</template>

<script setup lang="ts">
import type { PortfolioProject } from '@/data/resume'
import SlideContent from './SlideContent.vue'
import { useSlideCanvas } from '@/composables/useSlideCanvas'
import { inject } from 'vue'

const props = defineProps<{
  project: PortfolioProject
  container: HTMLElement | null
  isLast?: boolean
  animated?: boolean
}>()

const canvasRef = inject<import('vue').Ref<HTMLCanvasElement | null>>('slideCanvasRef')!
useSlideCanvas(() => props.animated, canvasRef)
</script>
```

**Step 2: Verify** — component compiles

**Step 3: Commit** — `git commit -m "feat: create ThreeStage parameterized slide"`

---

## Task 3: Move canvas into SlideReveal, provide ref

**Objective:** SlideReveal renders `<canvas>` as sibling of motion.div (not inside), provides canvasRef via provide.

**Files:**
- Modify: `src/components/ui/SlideReveal.vue`

**Step 1: Update SlideReveal template**

```vue
<template>
  <div class="slide-reveal-wrap">
    <canvas ref="canvasEl" class="slide-canvas"></canvas>
    <motion.div
      :key="key"
      ref="el"
      class="slide-reveal"
      :initial="initial"
      :animate="hasSnapped ? animate : initial"
      :transition="transition"
      :style="style"
    >
      <slot />
    </motion.div>
  </div>
</template>
```

**Step 2: Add canvas ref + provide**

```ts
import { provide } from 'vue'

const canvasEl = ref<HTMLCanvasElement | null>(null)
provide('slideCanvasRef', canvasEl)
```

**Step 3: Add wrapper + canvas CSS**

```css
.slide-reveal-wrap {
  position: relative;
  width: 100%;
  height: 100%;
}
.slide-canvas {
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
  pointer-events: none;
}
```

**Step 4: Verify** — `npx vue-tsc --noEmit` passes

**Step 5: Commit** — `git commit -m "refactor: SlideReveal owns canvas, provides ref"`

---

## Task 4: Update PortfolioView — use ThreeStage + registry

**Objective:** Replace 13 individual components with one ThreeStage, driven by JSON data.

**Files:**
- Modify: `src/views/PortfolioView.vue`
- Modify: `src/views/portfolio/slides/index.ts`

**Step 1: Simplify index.ts**

```ts
import { defineAsyncComponent, type Component } from 'vue'
import type { PortfolioProject } from '@/data/resume'

// Only custom components that need special THREE.js logic
const customSlides: Record<string, () => Promise<{ default: Component }>> = {
  '个人作品集网站': () => import('./PersonalVue.vue'),
}

// Default: use ThreeStage for everything else
const ThreeStage = defineAsyncComponent(() => import('./ThreeStage.vue'))

export function getSlide(project: PortfolioProject): Component {
  return customSlides[project.name]
    ? defineAsyncComponent(customSlides[project.name])
    : ThreeStage
}

export default getSlide
```

**Step 2: Update PortfolioView.vue**

```vue
<template>
  <div class="page">
    <ParticleScroll ref="psRef" :density="2" :spread="200" :band="400" :fade="0.8">
      <div class="slide title-slide">
        <h1 class="page-title">我的项目</h1>
        <p class="page-subtitle">个人作品与开源贡献</p>
      </div>
      <div
        v-for="(p, i) in portfolioProjects"
        :key="p.name"
        class="slide"
      >
        <SlideReveal
          :container="container"
          :variant="p.variant ?? 'fade-up'"
          @snap="onSlideSnap(i)"
          @unsnap="onSlideUnsnap(i)"
        >
          <component
            :is="getSlide(p)"
            :project="p"
            :container="container"
            :is-last="i === portfolioProjects.length - 1"
            :animated="snappedSlides[i]"
          />
        </SlideReveal>
      </div>
    </ParticleScroll>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { portfolioProjects } from '@/data/resume'
import ParticleScroll from '@/components/canvasui/ParticleScroll.vue'
import SlideReveal from '@/components/ui/SlideReveal.vue'
import { getSlide } from './portfolio/slides/index'

const psRef = ref<InstanceType<typeof ParticleScroll> | null>(null)
const container = computed(() => psRef.value?.contentEl ?? null)

const snappedSlides = reactive<boolean[]>(portfolioProjects.map(() => false))

function onSlideSnap(index: number) {
  snappedSlides[index] = true
}

function onSlideUnsnap(index: number) {
  snappedSlides[index] = false
}
</script>
```

Key changes:
- No more `slideVariants` cycling — variant comes from JSON `p.variant`
- No more `canvasMap` / `provide` — SlideReveal handles canvas
- `getSlide(p)` returns ThreeStage for most, PersonalVue for custom

**Step 3: Verify** — `npx vue-tsc --noEmit` + `npx vite build` pass

**Step 4: Commit** — `git commit -m "refactor: PortfolioView uses ThreeStage + JSON registry"`

---

## Task 5: Delete 12 identical slide components

**Objective:** Remove all individual slide .vue files that are now replaced by ThreeStage.

**Files:**
- Delete: `src/views/portfolio/slides/CellularAutomata.vue`
- Delete: `src/views/portfolio/slides/FlightSim.vue`
- Delete: `src/views/portfolio/slides/FlockingBoids.vue`
- Delete: `src/views/portfolio/slides/GPUASCII.vue`
- Delete: `src/views/portfolio/slides/MagicCircle.vue`
- Delete: `src/views/portfolio/slides/ObjViewer.vue`
- Delete: `src/views/portfolio/slides/OpenGLSolar.vue`
- Delete: `src/views/portfolio/slides/RuneGenerator.vue`
- Delete: `src/views/portfolio/slides/Solar.vue`
- Delete: `src/views/portfolio/slides/Stereoscopic.vue`
- Delete: `src/views/portfolio/slides/TextGlitch.vue`
- Delete: `src/views/portfolio/slides/WebGLCube.vue`
- Keep: `PersonalVue.vue` (custom THREE.js)
- Keep: `SlideContent.vue` (HTML overlay)
- Keep: `ThreeStage.vue` (new)

**Step 1: Delete files**

```bash
cd /d/Projects/Personal_Vue
rm src/views/portfolio/slides/CellularAutomata.vue
rm src/views/portfolio/slides/FlightSim.vue
rm src/views/portfolio/slides/FlockingBoids.vue
rm src/views/portfolio/slides/GPUASCII.vue
rm src/views/portfolio/slides/MagicCircle.vue
rm src/views/portfolio/slides/ObjViewer.vue
rm src/views/portfolio/slides/OpenGLSolar.vue
rm src/views/portfolio/slides/RuneGenerator.vue
rm src/views/portfolio/slides/Solar.vue
rm src/views/portfolio/slides/Stereoscopic.vue
rm src/views/portfolio/slides/TextGlitch.vue
rm src/views/portfolio/slides/WebGLCube.vue
```

**Step 2: Verify build**

```bash
npx vue-tsc --noEmit
npx vite build
```

Expected: clean build, no missing imports

**Step 3: Verify no orphaned references**

```bash
grep -r "CellularAutomata\|FlightSim\|FlockingBoids\|GPUASCII\|MagicCircle\|ObjViewer\|OpenGLSolar\|RuneGenerator\|Solar\.\|Stereoscopic\|TextGlitch\|WebGLCube" src/ --include="*.ts" --include="*.vue"
```

Expected: only matches in index.ts (which we updated) or none

**Step 4: Commit** — `git commit -m "refactor: delete 12 identical slide components, use ThreeStage"`

---

## Task 6: Clean up useSlideCanvas promise duplication

**Objective:** Remove the duplicate promise creation in useSlideCanvas.

**Files:**
- Modify: `src/composables/useSlideCanvas.ts`

**Current issue:** Promise is created in both the watch handler (line 67) AND drawAndFadeIn (line 54). The one in drawAndFadeIn overwrites the one in the watch.

**Fix:** Remove the promise creation from drawAndFadeIn. The watch handler already creates it synchronously before the setTimeout.

```ts
function drawAndFadeIn() {
  if (!animated() || !canvasRef.value) return
  const canvas = canvasRef.value
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const width = (canvas.width = canvas.offsetWidth)
  const height = (canvas.height = canvas.offsetHeight)

  ctx.clearRect(0, 0, width, height)

  const gradient = ctx.createLinearGradient(width, 0, width, height)
  gradient.addColorStop(0, 'rgba(255, 255, 255, 0)')
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0.3)')

  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)

  // Promise already created in watch handler — just animate
  gsap.fromTo(canvas,
    { opacity: 0 },
    { opacity: 1, duration: 1, onComplete: resolveAnimation! }
  )
}
```

**Step 1: Edit useSlideCanvas.ts**

**Step 2: Verify** — `npx vue-tsc --noEmit`

**Step 3: Commit** — `git commit -m "fix: remove duplicate promise creation in useSlideCanvas"`

---

## Task 7: Final verification

**Objective:** Ensure everything works end-to-end.

**Step 1: Full type check**

```bash
cd /d/Projects/Personal_Vue && npx vue-tsc --noEmit
```

Expected: clean

**Step 2: Production build**

```bash
npx vite build
```

Expected: success, no errors

**Step 3: Verify file structure**

```
src/views/portfolio/slides/
├── index.ts          # getSlide() registry
├── ThreeStage.vue    # parameterized slide (new)
├── PersonalVue.vue   # custom THREE.js (kept)
└── SlideContent.vue  # HTML overlay (kept)
```

**Step 4: Commit** — `git commit -m "chore: final verification pass"`

---

## Files Summary

| File | Action | Lines |
|------|--------|-------|
| `src/data/resume.ts` | Modified — add `variant` field | +13 |
| `src/views/portfolio/slides/ThreeStage.vue` | Created | ~25 |
| `src/components/ui/SlideReveal.vue` | Modified — canvas + provide | +20 |
| `src/views/PortfolioView.vue` | Modified — use getSlide + JSON | -30 |
| `src/views/portfolio/slides/index.ts` | Modified — registry function | rewrite |
| `src/composables/useSlideCanvas.ts` | Modified — remove dup promise | -5 |
| 12 slide .vue files | Deleted | -350 |

**Net result:** ~350 lines deleted, ~60 added. 13 components → 2 (ThreeStage + PersonalVue).

## Risks

- **SlideReveal canvas positioning:** Canvas must be sibling of motion.div. The wrapper div + `position: relative` ensures this.
- **provide/inject timing:** SlideReveal provides during setup. ThreeStage injects during its setup (descendant). Works because Vue's provide/inject is synchronous during setup.
- **PersonalVue custom render:** Still works — getSlide returns PersonalVue for that project, which has its own THREE.js logic.
