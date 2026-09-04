import { defineAsyncComponent, type Component } from 'vue'
import type { PortfolioProject } from '@/data/resume'

const ThreeStage = defineAsyncComponent(() => import('./ThreeStage.vue'))

// Only projects that need custom THREE.js logic
const customSlides: Record<string, () => Promise<{ default: Component }>> = {
  '个人作品集网站': () => import('./PersonalVue.vue'),
}

export function getSlide(project: PortfolioProject): Component {
  const loader = customSlides[project.name]
  return loader ? defineAsyncComponent(loader) : ThreeStage
}
