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
        <canvas
          class="slide-canvas"
          :ref="(el: any) => { if (el) canvasMap.set(p.name, el) }"
        ></canvas>
        <SlideReveal :container="container" :variant="slideVariants[i % slideVariants.length]" @snap="onSlideSnap(i)" @unsnap="onSlideUnsnap(i)">
          <component :is="getSlide(p.name)" :project="p" :container="container" :is-last="i === portfolioProjects.length - 1" :animated="snappedSlides[i]" />
        </SlideReveal>
      </div>
    </ParticleScroll>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, provide } from 'vue'
import { portfolioProjects } from '@/data/resume'
import ParticleScroll from '@/components/canvasui/ParticleScroll.vue'
import SlideReveal from '@/components/ui/SlideReveal.vue'
import slides from './portfolio/slides/index'

const psRef = ref<InstanceType<typeof ParticleScroll> | null>(null)
const container = computed(() => psRef.value?.contentEl ?? null)
const slideVariants = ['fade-up', 'scale', 'fade-left', 'blur'] as const

const snappedSlides = reactive<boolean[]>(portfolioProjects.map(() => false))

// canvas 在 SlideReveal 外面，不受 motion-v transform 影响
const canvasMap = new Map<string, HTMLCanvasElement>()
provide('slideCanvasMap', canvasMap)

function onSlideSnap(index: number) {
  snappedSlides[index] = true
}

function onSlideUnsnap(index: number) {
  snappedSlides[index] = false
}

function getSlide(name: string) {
  return slides[name]
}
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
.slide-canvas {
  position: absolute;
  display: block;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
</style>
