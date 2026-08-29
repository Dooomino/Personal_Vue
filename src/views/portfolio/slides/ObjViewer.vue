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

defineProps<{ project: PortfolioProject; container: HTMLElement | null; isLast?: boolean
  animated?: boolean }>()
</script>