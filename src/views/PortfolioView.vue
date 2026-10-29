<template>
  <div class="page">
    <!-- 老站项目页顶部滚动进度条 -->
    <div class="progress" aria-hidden="true">
      <div class="progress-fill" :style="{ transform: `scaleX(${progress})` }"></div>
    </div>
    <ParticleScroll ref="psRef" :density="2" :spread="200" :band="400" :fade="0.8">
      <div class="slide title-slide">
        <h1 class="u-page-title slide-heading">我的项目</h1>
        <p class="u-page-subtitle slide-heading">个人作品与开源贡献</p>
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
            :reverse="i % 2 === 1"
          />
        </SlideReveal>
      </div>
    </ParticleScroll>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch } from 'vue'
import { portfolioProjects } from '@/data/resume'
import ParticleScroll from '@/components/canvasui/ParticleScroll.vue'
import SlideReveal from '@/components/ui/SlideReveal.vue'
import { getSlide } from './portfolio/slides/index'

const psRef = ref<InstanceType<typeof ParticleScroll> | null>(null)
const container = computed(() => psRef.value?.contentEl ?? null)

const snappedSlides = reactive<boolean[]>(portfolioProjects.map(() => false))

function onSlideSnap(index: number) { snappedSlides[index] = true }
function onSlideUnsnap(index: number) { snappedSlides[index] = false }

/** 滚动进度：跟随 ParticleScroll 容器 */
const progress = ref(0)
function onScrollProgress() {
  const el = container.value
  if (!el) return
  const max = el.scrollHeight - el.clientHeight
  progress.value = max > 0 ? Math.min(1, el.scrollTop / max) : 0
}
watch(container, (el, prev) => {
  prev?.removeEventListener('scroll', onScrollProgress)
  el?.addEventListener('scroll', onScrollProgress, { passive: true })
  onScrollProgress()
})
</script>

<style scoped>
.page { width: 100%; position: relative; z-index: 1; }
.progress {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 2px;
  z-index: 60;
  pointer-events: none;
}
.progress-fill {
  height: 100%;
  background: var(--primary-color);
  transform: scaleX(0);
  transform-origin: left center;
  transition: transform 0.1s linear;
}
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
/* flex gap 控制间距,标题不带 primitives 的默认下边距 */
.slide-heading { margin: 0; }
</style>
