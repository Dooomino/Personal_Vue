<template>
  <SlideContent
    :project="project"
    :container="container"
    :is-last="isLast"
    :animated="animated"
    variant="blur"
  />
</template>

<script setup lang="ts">
import type { PortfolioProject } from '@/data/resume'
import SlideContent from './SlideContent.vue'
import { useSlideCanvas } from '@/composables/useSlideCanvas'
import { inject, computed } from 'vue'

const props = defineProps<{
  project: PortfolioProject
  container: HTMLElement | null
  isLast?: boolean
  animated?: boolean
}>()

const canvasMap = inject<Map<string, HTMLCanvasElement>>('slideCanvasMap')!
const canvasEl = computed(() => canvasMap.get(props.project.name) ?? null)

useSlideCanvas(() => props.animated, canvasEl)
</script>
