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
