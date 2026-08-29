<template>
  <canvas class="slide-canvas" ref="canvas" >

  </canvas>
  <SlideContent
    :project="project"
    :container="container"
    :is-last="isLast"
    :animated="animated"
    variant="scale"
  />
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import gsap from 'gsap'
import type { PortfolioProject } from '@/data/resume'
import SlideContent from './SlideContent.vue'
const props = defineProps<{ project: PortfolioProject; container: HTMLElement | null; isLast?: boolean
  animated?: boolean }>()

  watch(
    () => props.animated,
    (newVal) => {
      if (newVal) {
        setTimeout(() => {
          nextTick(() => {
            const ctx = gsap.context(() => {
              const canvas = document.querySelector('.slide-canvas') as HTMLCanvasElement
              if (canvas) {
                const ctx = canvas.getContext('2d')
                if (ctx) {
                  ctx.clearRect(0, 0, canvas.width, canvas.height)
                  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'
                  ctx.fillRect(0, 0, canvas.width, canvas.height)
                }
              }
            })
          })
        }, 300)
      }
    }
  )
</script>
