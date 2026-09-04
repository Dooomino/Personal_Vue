<template>
  <SlideContent
    :project="project"
    :container="container"
    :is-last="isLast"
    :animated="animated"
    variant="scale"
  />
</template>

<script setup lang="ts">
import type { PortfolioProject } from '@/data/resume'
import SlideContent from './SlideContent.vue'
import { useSlideCanvas } from '@/composables/useSlideCanvas'
import { createThreeScene } from '@/utils/three'
import * as THREE from 'three'
import { watch, inject, computed } from 'vue'

const props = defineProps<{
  project: PortfolioProject
  container: HTMLElement | null
  isLast?: boolean
  animated?: boolean
}>()

const canvasMap = inject<Map<string, HTMLCanvasElement>>('slideCanvasMap')!
const canvasEl = computed(() => canvasMap.get(props.project.name) ?? null)

const { animationDone } = useSlideCanvas(() => props.animated, canvasEl)

let threeReady = false

watch(() => props.animated, (v) => {
  if (!v || threeReady) return
  threeReady = true
  animationDone.then(() => {
    const { renderer, scene, camera } = createThreeScene(canvasEl.value!)
    camera.position.z = 5

    const box = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshBasicMaterial({ color: 0x00ff00 })
    )
    scene.add(box)
    renderer.render(scene, camera)
  })
})
</script>
