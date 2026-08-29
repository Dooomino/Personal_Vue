import { defineAsyncComponent, type Component } from 'vue'

const slides: Record<string, Component> = {
  '个人作品集网站': defineAsyncComponent(() => import('./PersonalVue.vue')),
  'MagicCircle': defineAsyncComponent(() => import('./MagicCircle.vue')),
  '太阳系': defineAsyncComponent(() => import('./Solar.vue')),
  'OpenGL 太阳系演示': defineAsyncComponent(() => import('./OpenGLSolar.vue')),
  '文字故障': defineAsyncComponent(() => import('./TextGlitch.vue')),
  '符文生成器': defineAsyncComponent(() => import('./RuneGenerator.vue')),
  'Cellular Automata': defineAsyncComponent(() => import('./CellularAutomata.vue')),
  'WebGL Cube': defineAsyncComponent(() => import('./WebGLCube.vue')),
  '立体视觉展示': defineAsyncComponent(() => import('./Stereoscopic.vue')),
  'Flight Simulator': defineAsyncComponent(() => import('./FlightSim.vue')),
  'ObjViewer': defineAsyncComponent(() => import('./ObjViewer.vue')),
  'Flocking Boids': defineAsyncComponent(() => import('./FlockingBoids.vue')),
  'GPU-ASCII': defineAsyncComponent(() => import('./GPUASCII.vue')),
}

export default slides
