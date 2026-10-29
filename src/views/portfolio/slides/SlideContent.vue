<template>
  <div class="slide-content" :class="{ 'has-media': hasMedia }" ref="slideContentEl">
    <SlideReveal :container="container" :variant="variant">
      <div class="cols" :class="{ reverse }">
        <div class="col-text">
          <h2 ref="nameEl" class="project-name">{{ project.name }}</h2>
          <p ref="descEl" class="project-desc">{{ project.description }}</p>
          <div class="tags">
            <span v-for="tech in project.techStack" :key="tech" ref="tagEls" class="u-tag">{{ tech }}</span>
          </div>
          <div class="links">
            <a v-if="project.github" ref="linkEls" :href="project.github" target="_blank" class="link">↗ GitHub</a>
            <a v-if="project.demo" ref="linkEls" :href="project.demo" target="_blank" class="link">↗ Demo</a>
          </div>
        </div>
        <div v-if="hasMedia" class="col-media">
          <img
            v-for="img in project.images"
            :key="img"
            class="media-img"
            :class="{ stack: (project.images?.length ?? 0) > 1 }"
            :src="img"
            :alt="project.name"
            loading="lazy"
          />
          <video
            v-if="project.video"
            class="media-video"
            :src="project.video"
            controls
            preload="metadata"
          ></video>
        </div>
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
import { ref, onMounted, onBeforeUnmount, watch, computed } from 'vue'
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
  /** 图文左右交替（老站项目页布局）：true = 媒体在左 */
  reverse?: boolean
}>()

const hasMedia = computed(
  () => (props.project.images?.length ?? 0) > 0 || !!props.project.video,
)

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
      ease: 'power1.inOut',
      repeat: -1,
      yoyo: true,
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
  { immediate: true },
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
  height: 90vh;
}
/* 图文两栏（有媒体时），否则维持原居中单栏 */
.cols {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.slide-content.has-media .cols {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: clamp(24px, 4vw, 56px);
  align-items: center;
  padding: 0 clamp(8px, 3vw, 48px);
}
.slide-content.has-media .cols.reverse .col-text { order: 2; }
.slide-content.has-media .cols.reverse .col-media { order: 1; }
.col-text {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.col-media {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-width: 0;
}
.media-img {
  max-width: 100%;
  max-height: 44vh;
  object-fit: contain;
  border-radius: 12px;
  border: 1px solid var(--glass-border);
  background: var(--glass-bg);
}
.media-img.stack { max-height: 21vh; }
.media-video {
  width: 100%;
  max-width: 520px;
  border-radius: 12px;
  border: 1px solid var(--glass-border);
  background: #000;
}
@media (max-width: 768px) {
  .slide-content.has-media .cols { grid-template-columns: 1fr; }
  .slide-content.has-media .cols.reverse .col-text { order: 1; }
  .slide-content.has-media .cols.reverse .col-media { order: 2; }
  .media-img { max-height: 26vh; }
  .media-img.stack { max-height: 16vh; }
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
.link:hover { text-decoration: underline; }
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
<!-- ponytail: keep hardcoded hover, upgrade path: --primary-color-light var -->
