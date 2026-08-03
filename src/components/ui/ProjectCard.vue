<template>
  <div
    ref="cardRef"
    class="card"
    :style="{ animationDelay: `${index * 80}ms`, transform }"
    @mouseenter="onEnter"
  >
    <h3 class="card-title">{{ project.name }}</h3>
    <p class="card-desc">{{ project.description }}</p>
    <div class="tags">
      <span v-for="tech in project.techStack" :key="tech" class="tag">{{ tech }}</span>
    </div>
    <a v-if="project.github" :href="project.github" target="_blank" class="card-link">
      <span class="link-icon">↗</span> GitHub
    </a>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import type { PortfolioProject } from '@/data/resume'

defineProps<{ project: PortfolioProject; index: number }>()

const cardRef = ref<HTMLElement>()
const transform = ref('')
let active = false

function onEnter() { active = true }

function onGlobalMove(e: MouseEvent) {
  if (!active) return
  const el = cardRef.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  const pad = 80
  const x = (e.clientX - (rect.left - pad)) / (rect.width + pad * 2) - 0.5
  const y = (e.clientY - (rect.top - pad)) / (rect.height + pad * 2) - 0.5
  const cx = Math.max(-0.5, Math.min(0.5, x))
  const cy = Math.max(-0.5, Math.min(0.5, y))
  if (Math.abs(cx) > 0.495 || Math.abs(cy) > 0.495) {
    transform.value = ''
    return
  }
  const ease = (v: number) => Math.sin(v * Math.PI)
  transform.value = `perspective(800px) rotateY(${ease(cx) * 10}deg) rotateX(${ease(cy) * -10}deg) translateY(-4px)`
}

function onGlobalLeave() {
  active = false
  transform.value = ''
}

onMounted(() => {
  document.addEventListener('mousemove', onGlobalMove)
  document.addEventListener('mouseleave', onGlobalLeave)
})

onUnmounted(() => {
  document.removeEventListener('mousemove', onGlobalMove)
  document.removeEventListener('mouseleave', onGlobalLeave)
})
</script>

<style scoped>
.card {
  background: linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 28px;
  transition: transform 0.15s ease-out, border-color 0.3s, box-shadow 0.3s;
  animation: cardIn 0.5s ease both;
}
.card:hover {
  border-color: rgba(96, 165, 250, 0.3);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3);
}
.card-title {
  font-size: 17px;
  font-weight: 600;
  color: #f0f0f0;
  margin: 0 0 10px;
  letter-spacing: -0.01em;
}
.card-desc {
  font-size: 13.5px;
  color: rgba(255, 255, 255, 0.55);
  margin: 0 0 16px;
  line-height: 1.65;
}
.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 16px;
}
.tag {
  font-size: 11px;
  padding: 3px 9px;
  border-radius: 999px;
  color: #60a5fa;
  background: rgba(96, 165, 250, 0.08);
  border: 1px solid rgba(96, 165, 250, 0.15);
}
.card-link {
  font-size: 13px;
  color: #60a5fa;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  transition: color 0.2s;
}
.card-link:hover { color: #93c5fd; }
.link-icon { font-size: 11px; }
@keyframes cardIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>
