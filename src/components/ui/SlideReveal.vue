<template>
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
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, type CSSProperties } from 'vue'
import { motion } from 'motion-v'

const props = withDefaults(defineProps<{
  container?: HTMLElement | null
  initial?: Record<string, unknown>
  animate?: Record<string, unknown>
  transition?: Record<string, unknown>
  style?: CSSProperties
  variant?: 'fade-up' | 'fade-left' | 'scale' | 'blur' | 'none'
}>(), {
  variant: 'fade-up',
})

const el = ref<HTMLElement | null>(null)
const hasSnapped = ref(false)
const emit = defineEmits<{ snap: []; unsnap: [] }>()

let checkInterval = 0

function checkVisibility() {
  const node = el.value?.$el ?? el.value
  const container = props.container
  if (!node?.getBoundingClientRect || !container) return

  const rect = node.getBoundingClientRect()
  const cRect = container.getBoundingClientRect()
  const isVisible = rect.top < cRect.bottom && rect.bottom > cRect.top

  if (isVisible && !hasSnapped.value) {
    hasSnapped.value = true
    emit('snap')
  } else if (!isVisible && hasSnapped.value) {
    hasSnapped.value = false
    emit('unsnap')
  }
}

onMounted(() => {
  checkInterval = window.setInterval(checkVisibility, 200)
  checkVisibility()
})

onUnmounted(() => clearInterval(checkInterval))

// Re-check when container changes
watch(() => props.container, () => { setTimeout(checkVisibility, 100) })

const presets: Record<string, { initial: Record<string, unknown>; animate: Record<string, unknown>; transition: Record<string, unknown> }> = {
  'fade-up': {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { type: 'spring', stiffness: 100, damping: 20, mass: 1 },
  },
  'fade-left': {
    initial: { opacity: 0, x: -80, rotateY: -15 },
    animate: { opacity: 1, x: 0, rotateY: 0 },
    transition: { type: 'spring', stiffness: 80, damping: 18 },
  },
  'scale': {
    initial: { opacity: 0, scale: 0.8, filter: 'blur(10px)' },
    animate: { opacity: 1, scale: 1, filter: 'blur(0px)' },
    transition: { type: 'spring', stiffness: 120, damping: 22 },
  },
  'blur': {
    initial: { opacity: 0, filter: 'blur(20px)', y: 30 },
    animate: { opacity: 1, filter: 'blur(0px)', y: 0 },
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
  },
  'none': { initial: {}, animate: {}, transition: { duration: 0 } },
}

const preset = computed(() => presets[props.variant] ?? presets['fade-up'])
const initial = computed(() => props.initial ?? preset.value.initial)
const animate = computed(() => props.animate ?? preset.value.animate)
const transition = computed(() => props.transition ?? preset.value.transition)

const key = ref(0)
watch(() => props.container, (c) => { if (c) key.value++ })
</script>

<style>
.slide-reveal {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: all 0.3s ease;
}
</style>
