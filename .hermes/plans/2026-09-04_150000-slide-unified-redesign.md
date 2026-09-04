# Slide System Unified Redesign

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Eliminate 12 identical slide components, fix canvas ownership, clean up data flow — all in one coherent refactor.

**Architecture:** Slide data drives everything via JSON `variant` field. One `ThreeStage.vue` handles all standard slides. `SlideReveal` owns the canvas (sibling of motion.div). `useSlideCanvas` simplified. PortfolioView reads variant from JSON, not hardcoded cycling.

**Tech Stack:** Vue 3, Three.js, gsap, motion-v, TypeScript

---

## Current Problems (consolidated)

1. **12 identical slide components** — only `variant` differs, every one has identical boilerplate
2. **Canvas ownership split** — PortfolioView (DOM), SlideReveal (visibility), useSlideCanvas (behavior) — three places for one concept
3. **Non-reactive Map + inject** — `canvasMap` is a plain `Map`, `computed` won't re-evaluate. Works by accident (1s delay) but fragile
4. **Duplicate promise creation** — `useSlideCanvas` creates `animationDone` in both watch handler AND `drawAndFadeIn`
5. **Variant cycling hardcoded** — `slideVariants[i % slideVariants.length]` instead of reading from data
6. **13 async imports in index.ts** — one per project, 12 identical

## Target Architecture

```
resume.ts: portfolioProjects[{ name, description, techStack, github, demo, variant }]
                ↓
PortfolioView: <SlideReveal :variant="p.variant"> → <component :is="getSlide(p)">
                ↓
SlideReveal: canvas (sibling of motion.div) + provide('slideCanvasRef')
                ↓
ThreeStage.vue: inject canvasRef → useSlideCanvas → SlideContent (HTML overlay)
PersonalVue.vue: inject canvasRef → useSlideCanvas → THREE.js + SlideContent
```

---

## Task 1: Add `variant` to PortfolioProject JSON

**Objective:** Each project carries its own animation variant in the data layer.

**Files:**
- Modify: `src/data/resume.ts`

**Step 1: Update interface**

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

**Step 2: Add variant to each project**

Variant mapping (from current `slideVariants[i % 4]` cycling):
- fade-up: 个人作品集网站, CellularAutomata, FlockingBoids, Solar
- fade-left: MagicCircle, FlightSim, RuneGenerator
- scale: GPUASCII, Stereoscopic, TextGlitch
- blur: ObjViewer, OpenGLSolar, WebGLCube

**Step 3: Verify** — `npx vue-tsc --noEmit`

**Step 4: Commit** — `git commit -m "feat: add variant to PortfolioProject JSON"`

---

## Task 2: Move canvas into SlideReveal

**Objective:** SlideReveal renders `<canvas>` as sibling of motion.div (not inside), provides canvasRef via provide. Eliminates the inject Map.

**Files:**
- Modify: `src/components/ui/SlideReveal.vue`

**Step 1: Update template** — wrap in div, canvas before motion.div:

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
const canvasEl = ref<HTMLCanvasElement | null>(null)
provide('slideCanvasRef', canvasEl)
```

**Step 3: Add CSS**

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

**Step 4: Verify** — `npx vue-tsc --noEmit`

**Step 5: Commit** — `git commit -m "refactor: SlideReveal owns canvas, provides ref"`

---

## Task 3: Simplify useSlideCanvas

**Objective:** Remove duplicate promise creation, make canvasRef required.

**Files:**
- Modify: `src/composables/useSlideCanvas.ts`

**Key changes:**
- `canvasRef` parameter is now required (always from SlideReveal)
- Remove promise creation from `drawAndFadeIn` (only in watch handler)
- Remove `externalCanvas` optional parameter

```ts
export function useSlideCanvas(
  animated: () => boolean | undefined,
  canvasRef: Ref<HTMLCanvasElement | null>
) {
  let resolveAnimation: (() => void) | null = null
  let animationDone: Promise<void> = Promise.resolve()
  let pendingTimer = 0

  // clearCanvas and drawAndFadeIn unchanged except:
  // drawAndFadeIn does NOT create promise — watch handler does

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

    gsap.fromTo(canvas,
      { opacity: 0 },
      { opacity: 1, duration: 1, onComplete: resolveAnimation! }
    )
  }

  watch(animated, (v) => {
    clearTimeout(pendingTimer)
    if (v) {
      animationDone = new Promise<void>((resolve) => {
        resolveAnimation = resolve
      })
      pendingTimer = setTimeout(() => nextTick(drawAndFadeIn), 1000)
    } else {
      clearCanvas()
    }
  })

  return { canvasRef, get animationDone() { return animationDone } }
}
```

**Step 1: Rewrite useSlideCanvas.ts**

**Step 2: Verify** — `npx vue-tsc --noEmit`

**Step 3: Commit** — `git commit -m "refactor: simplify useSlideCanvas, single promise"`

---

## Task 4: Create ThreeStage.vue

**Objective:** One parameterized component replaces 12 identical slides. Reads variant from JSON.

**Files:**
- Create: `src/views/portfolio/slides/ThreeStage.vue`

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

**Step 1: Create ThreeStage.vue**

**Step 2: Verify** — component compiles

**Step 3: Commit** — `git commit -m "feat: create ThreeStage parameterized slide"`

---

## Task 5: Rewrite index.ts as getSlide() function

**Objective:** Replace 13 async imports with a function that returns ThreeStage or custom component.

**Files:**
- Rewrite: `src/views/portfolio/slides/index.ts`

```ts
import { defineAsyncComponent, type Component } from 'vue'
import type { PortfolioProject } from '@/data/resume'

const ThreeStage = defineAsyncComponent(() => import('./ThreeStage.vue'))

// Only projects that need custom THREE.js logic
const customSlides: Record<string, () => Promise<{ default: Component }>> = {
  '个人作品集网站': () => import('./PersonalVue.vue'),
}

export function getSlide(project: PortfolioProject): Component {
  const loader = customSlides[project.name]
  return loader ? defineAsyncComponent(loader) : ThreeStage
}
```

**Step 1: Rewrite index.ts**

**Step 2: Verify** — `npx vue-tsc --noEmit`

**Step 3: Commit** — `git commit -m "refactor: index.ts as getSlide() function"`

---

## Task 6: Update PortfolioView

**Objective:** Use JSON variant + getSlide(), remove canvasMap/provide/canvas DOM.

**Files:**
- Rewrite: `src/views/PortfolioView.vue`

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

function onSlideSnap(index: number) { snappedSlides[index] = true }
function onSlideUnsnap(index: number) { snappedSlides[index] = false }
</script>

<style scoped>
.page { width: 100%; position: relative; z-index: 1; }
.slide {
  height: 100vh;
  scroll-snap-align: start;
  display: grid;
  place-items: top center;
  position: relative;
  padding: 40px 28px;
  box-sizing: border-box;
  z-index: 2;
}
.title-slide { gap: 12px; text-align: center; display: flex; flex-direction: column; justify-content: center; height: 100vh; }
.page-title { font-size: 32px; font-weight: 700; color: var(--text-primary); margin: 0; }
.page-subtitle { font-size: 14px; color: var(--text-secondary); margin: 0; }
</style>
```

Key changes:
- `:variant="p.variant ?? 'fade-up'"` — from JSON, not cycling
- `getSlide(p)` — returns ThreeStage or PersonalVue
- No canvasMap, no provide, no canvas DOM — SlideReveal handles it

**Step 1: Rewrite PortfolioView.vue**

**Step 2: Verify** — `npx vue-tsc --noEmit` + `npx vite build`

**Step 3: Commit** — `git commit -m "refactor: PortfolioView uses JSON variant + getSlide()"`

---

## Task 7: Update PersonalVue.vue

**Objective:** Use inject from SlideReveal instead of Map.

**Files:**
- Rewrite: `src/views/portfolio/slides/PersonalVue.vue`

```vue
<template>
  <SlideContent
    :project="project"
    :container="container"
    :is-last="isLast"
    :animated="animated"
    variant="scale"
  />
</template>

<script setup lang="ts">
import type { PortfolioProject } from '@/data/resume'
import SlideContent from './SlideContent.vue'
import { useSlideCanvas } from '@/composables/useSlideCanvas'
import { createThreeScene } from '@/utils/three'
import * as THREE from 'three'
import { watch, inject } from 'vue'

const props = defineProps<{
  project: PortfolioProject
  container: HTMLElement | null
  isLast?: boolean
  animated?: boolean
}>()

const canvasRef = inject<import('vue').Ref<HTMLCanvasElement | null>>('slideCanvasRef')!
const { animationDone } = useSlideCanvas(() => props.animated, canvasRef)

let threeReady = false
watch(() => props.animated, (v) => {
  if (!v || threeReady) return
  threeReady = true
  animationDone.then(() => {
    const { renderer, scene, camera } = createThreeScene(canvasRef.value!)
    camera.position.z = 5
    const box = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshBasicMaterial({ color: 0x00ff00 })
    )
    scene.add(box)
    renderer.render(scene, camera)
  })
})
</script>
```

**Step 1: Rewrite PersonalVue.vue**

**Step 2: Verify** — `npx vue-tsc --noEmit`

**Step 3: Commit** — `git commit -m "refactor: PersonalVue uses inject from SlideReveal"`

---

## Task 8: Delete 12 identical slide components

**Objective:** Remove all replaced slide files.

**Files:**
- Delete: 12 .vue files in `src/views/portfolio/slides/`

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

**Step 1: Delete files**

**Step 2: Verify no orphaned imports**

```bash
grep -r "CellularAutomata\|FlightSim\|FlockingBoids\|GPUASCII\|MagicCircle\|ObjViewer\|OpenGLSolar\|RuneGenerator\|Solar\.\|Stereoscopic\|TextGlitch\|WebGLCube" src/ --include="*.ts" --include="*.vue"
```

Expected: no matches

**Step 3: Verify build**

```bash
npx vue-tsc --noEmit && npx vite build
```

**Step 4: Commit** — `git commit -m "refactor: delete 12 identical slide components"`

---

## Task 9: Final cleanup + verify file structure

**Objective:** Confirm clean state.

**Expected file structure:**
```
src/views/portfolio/slides/
├── index.ts           # getSlide() function
├── ThreeStage.vue     # parameterized slide (new)
├── PersonalVue.vue    # custom THREE.js (kept)
└── SlideContent.vue   # HTML overlay (kept)
```

**Step 1: Verify build one last time**

```bash
cd /d/Projects/Personal_Vue && npx vue-tsc --noEmit && npx vite build
```

**Step 2: Commit** — `git commit -m "chore: final verification"`

---

## Files Summary

| File | Action |
|------|--------|
| `src/data/resume.ts` | Modified — add `variant` field |
| `src/components/ui/SlideReveal.vue` | Modified — canvas + provide |
| `src/composables/useSlideCanvas.ts` | Modified — single promise, required canvasRef |
| `src/views/PortfolioView.vue` | Rewritten — JSON variant + getSlide() |
| `src/views/portfolio/slides/ThreeStage.vue` | Created |
| `src/views/portfolio/slides/index.ts` | Rewritten — getSlide() function |
| `src/views/portfolio/slides/PersonalVue.vue` | Rewritten — inject from SlideReveal |
| 12 slide .vue files | Deleted |
| `src/utils/three.ts` | Unchanged |
| `src/stores/theme.ts` | Unchanged |
| `src/styles/base.scss` | Unchanged |

**Net result:** ~400 lines deleted, ~80 added. 13 components → 2 (ThreeStage + PersonalVue). One coherent data flow.
