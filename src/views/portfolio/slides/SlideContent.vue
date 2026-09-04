<template>
  <div class="slide-content" ref="slideContentEl">
    <SlideReveal :container="container" :variant="variant">
      <h2 ref="nameEl" class="project-name">{{ project.name }}</h2>
      <p ref="descEl" class="project-desc">{{ project.description }}</p>
      <div class="tags">
        <span v-for="tech in project.techStack" :key="tech" ref="tagEls" class="tag">{{ tech }}</span>
      </div>
      <div class="links">
        <a v-if="project.github" ref="linkEls" :href="project.github" target="_blank" class="link">↗ GitHub</a>
        <a v-if="project.demo" ref="linkEls" :href="project.demo" target="_blank" class="link">↗ Demo</a>
      </div>
    </SlideReveal>
    <div class="arrow-wrap">
      <svg ref="arrowSvg" class="arrow-svg" viewBox="0 0 24 48" fill="none">
        <path ref="arrowPath" d="M12 4 L12 40 M4 32 L12 40 L20 32" stroke="rgba(255,255,255,0.2)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import gsap from 'gsap'
import type { PortfolioProject } from '@/data/resume'
import SlideReveal from '@/components/ui/SlideReveal.vue'
import { useThemeStore } from '@/stores/theme'

const themeStore = useThemeStore()
const props = defineProps<{
  project: PortfolioProject
  container: HTMLElement | null
  isLast?: boolean
  animated?: boolean
  variant?: 'fade-up' | 'fade-left' | 'scale' | 'blur' | 'none'
}>()

// --- refs ---
const slideContentEl = ref<HTMLElement | null>(null)
const nameEl = ref<HTMLElement | null>(null)
const descEl = ref<HTMLElement | null>(null)
const tagEls = ref<HTMLElement[]>([])
const linkEls = ref<HTMLElement[]>([])
const arrowSvg = ref<SVGSVGElement | null>(null)
const arrowPath = ref<SVGPathElement | null>(null)

let ctx: gsap.Context | null = null

// --- 从 CSS 变量读取主题色 ---
const readThemeColors = () => {
  const cs = getComputedStyle(document.documentElement)
  const v = (name: string) => cs.getPropertyValue(name).trim()
  return {
    name: v('--text-primary'),
    desc: v('--text-secondary'),
    tagBorder: v('--tag-border'),
    tagBg: v('--tag-bg'),
    arrow: v('--arrow-color'),
  }
}

// --- 箭头绘制动画 ---
onMounted(() => {
  if (!arrowPath.value || props.isLast) return
  const path = arrowPath.value
  const length = path.getTotalLength()

  gsap.set(path, { strokeDasharray: length, strokeDashoffset: length })

  ctx = gsap.context(() => {
    gsap.to(path, {
      strokeDashoffset: 0,
      duration: 1.2,
      ease: 'power2.inOut',
      repeat: -1,
      repeatDelay: 0.8,
    })
    gsap.to(arrowSvg.value, {
      y: 6,
      duration: 1,
      repeat: -1,
      yoyo: true,
      ease: 'power1.inOut',
    })
  })
})

// --- 主题切换：GSAP 渐变过渡 ---
watch(
  () => themeStore.isDarkMode,
  () => {
    const colors = readThemeColors()

    const targets: gsap.TweenTarget[] = []
    const colorMap = new Map<Element, Record<string, string>>()

    // 箭头颜色
    if (arrowPath.value) {
      targets.push(arrowPath.value)
      colorMap.set(arrowPath.value, { stroke: colors.arrow })
    }

    // 标题颜色
    if (nameEl.value) {
      targets.push(nameEl.value)
      colorMap.set(nameEl.value, { color: colors.name })
    }

    // 描述颜色
    if (descEl.value) {
      targets.push(descEl.value)
      colorMap.set(descEl.value, { color: colors.desc })
    }

    // 标签边框和背景
    tagEls.value.forEach((tag) => {
      targets.push(tag)
      colorMap.set(tag, { borderColor: colors.tagBorder, backgroundColor: colors.tagBg })
    })

    // 逐元素设置不同属性
    targets.forEach((target) => {
      const props = colorMap.get(target as Element)
      if (props) {
        gsap.to(target, { ...props, duration: 0.5, ease: 'power2.inOut' })
      }
    })
  },
  { immediate: true }
)

onBeforeUnmount(() => ctx?.revert())
</script>

<style scoped>
.slide-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}
.project-name {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 12px;
  letter-spacing: -0.01em;
  text-align: center;
}
.project-desc {
  font-size: 15px;
  color: var(--text-secondary);
  margin: 0 0 20px;
  line-height: 1.7;
  text-align: center;
}
.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 20px;
  justify-content: center;
}
.tag {
  font-size: 12px;
  padding: 4px 12px;
  border-radius: 999px;
  color: var(--primary-color);
  background: var(--tag-bg);
  border: 1px solid var(--tag-border);
}
.links {
  display: flex;
  gap: 16px;
  justify-content: center;
}
.link {
  font-size: 14px;
  color: var(--primary-color);
  text-decoration: none;
  transition: color 0.2s;
}
.link:hover { color: #93c5fd; }
.arrow-wrap {
  margin-top: auto;
  margin-bottom: 8rem;
  padding-top: 16px;
}
.arrow-svg {
  width: 24px;
  height: 48px;
}

</style>
<style >
.slide-canvas {
  position: absolute;
  display: block;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  /* background: blue; */
}
</style>
<!-- ponytail: keep hardcoded hover, upgrade path: --primary-color-light var -->
