<template>
  <div class="page">
    <div class="bg-layer" aria-hidden="true">
      <canvas ref="canvasRef" class="bg-canvas"></canvas>
    </div>
    <div class="content" v-if="canvasReady">
      <div class="header fade-in">
        <h1 class="page-title">工作经历</h1>
        <p class="page-subtitle">{{ summary }}</p>
      </div>

      <section
        v-for="(exp, ei) in workExperience"
        :key="exp.company"
        class="section fade-in"
        :style="{ animationDelay: `${(ei + 1) * 100}ms` }"
      >
        <div class="section-header">
          <h2 class="section-title">{{ exp.company }}</h2>
          <span class="badge badge--blue">{{ exp.title }}</span>
          <span class="section-period">{{ exp.period }}</span>
        </div>
        <div class="cards">
          <ExperienceCard v-for="(p, pi) in exp.projects" :key="p.name" :project="p" :index="pi" />
        </div>
      </section>

      <section class="section fade-in" :style="{ animationDelay: `${(workExperience.length + 1) * 100}ms` }">
        <h2 class="section-title">教育背景</h2>
        <div class="edu-card">
          <div class="edu-header">
            <h3 class="edu-school">{{ education.school }}</h3>
            <span class="edu-period">{{ education.period }}</span>
          </div>
          <p class="edu-degree">{{ education.degree }}</p>
          <div class="tags">
            <SkillBadge v-for="(c, ci) in education.courses" :key="c" :skill="c" :delay="ci * 50" />
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { workExperience, summary, education } from '@/data/resume'
import ExperienceCard from '@/components/ui/ExperienceCard.vue'
import SkillBadge from '@/components/ui/SkillBadge.vue'
import { ref, onMounted, onBeforeUnmount } from 'vue'
import * as THREE from 'three'

/** 视觉规范：月相轨道 — 外圆/轨道描边 + 亮面金色填充，无光照 / 无 PBR */
const COLOR_GOLD = 0xffd700
const COLOR_BG = 0x1a1a2e

const ORBIT_RADIUS = 2.35
const ICON_RATIO = 0.15
const ICON_RADIUS = ORBIT_RADIUS * ICON_RATIO
const CENTER_RADIUS = ORBIT_RADIUS * 0.015

/** 轨道上 8 个采样相位：0=新月，0.25=上弦（右半亮），0.5=满月，0.75=下弦 */
const PHASE_COUNT = 8
const MOON_PHASES: number[] = Array.from({ length: PHASE_COUNT }, (_, i) => i / PHASE_COUNT)

const canvasRef = ref<HTMLCanvasElement | null>(null)
const canvasReady = ref(false)

let renderer: THREE.WebGLRenderer | null = null
let camera: THREE.OrthographicCamera | null = null
let scene: THREE.Scene | null = null
let root: THREE.Group | null = null
let moonGroups: THREE.Group[] = []
let animationId = 0
let resizeHandler: (() => void) | null = null
let clock: THREE.Clock | null = null

function circlePoints(radius: number, segments: number): THREE.Vector3[] {
  const pts: THREE.Vector3[] = []
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * Math.PI * 2
    pts.push(new THREE.Vector3(Math.cos(a) * radius, Math.sin(a) * radius, 0))
  }
  return pts
}

function normalizePhase(phase: number): number {
  return ((phase % 1) + 1) % 1
}

/**
 * 晨昏线椭圆有符号半宽 a：
 * 盈月 a = R·cos(2πp)（新月 +R → 弦 0 → 满 -R）
 * 亏月取反，使细牙落在左侧。
 */
function terminatorSemiX(R: number, phase: number): number {
  const p = normalizePhase(phase)
  const isWaxing = p < 0.5
  return (isWaxing ? 1 : -1) * R * Math.cos(p * Math.PI * 2)
}

function ensureCCW(pts: THREE.Vector2[]): THREE.Vector2[] {
  let area = 0
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i]
    const b = pts[(i + 1) % pts.length]
    area += a.x * b.y - b.x * a.y
  }
  return area < 0 ? pts.slice().reverse() : pts
}

function ensureCW(pts: THREE.Vector2[]): THREE.Vector2[] {
  let area = 0
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i]
    const b = pts[(i + 1) % pts.length]
    area += a.x * b.y - b.x * a.y
  }
  return area > 0 ? pts.slice().reverse() : pts
}

function sampleCircleArc(R: number, a0: number, a1: number, seg = 48): THREE.Vector2[] {
  const pts: THREE.Vector2[] = []
  for (let i = 0; i <= seg; i++) {
    const t = a0 + ((a1 - a0) * i) / seg
    pts.push(new THREE.Vector2(Math.cos(t) * R, Math.sin(t) * R))
  }
  return pts
}

function shapeFromRing(outer: THREE.Vector2[], holes: THREE.Vector2[][] = []): THREE.Shape {
  const shape = new THREE.Shape(ensureCCW(outer))
  for (const h of holes) {
    shape.holes.push(new THREE.Path(ensureCW(h)))
  }
  return shape
}

/**
 * 亮面填充：统一单轮廓 —— 晨昏线（上→下）+ 亮侧外弧（下→上）。
 * 不用与外圆相交的 hole（两极重合会导致 ShapeGeometry 三角化失败）。
 * 新月/月食：外圈环形填色；满月：整圆。
 * 盈月亮在右，亏月亮在左。
 */
function moonPhaseShape(R: number, phase: number, segments = 64): THREE.Shape | null {
  const p = normalizePhase(phase)

  // 新月 / 月食：外圈细环（内圆严格在内，hole 不与外圆相交）
  if (p < 0.012 || p > 0.988) {
    const outer = sampleCircleArc(R, 0, Math.PI * 2, segments)
    const inner = sampleCircleArc(R * 0.94, 0, Math.PI * 2, segments)
    return shapeFromRing(outer, [inner])
  }

  if (Math.abs(p - 0.5) < 0.012) {
    return shapeFromRing(sampleCircleArc(R, 0, Math.PI * 2, segments))
  }

  const a = terminatorSemiX(R, p)
  const litDir = p < 0.5 ? 1 : -1

  const term: THREE.Vector2[] = []
  const limbLit: THREE.Vector2[] = []
  for (let i = 0; i <= segments; i++) {
    const y = R - (2 * R * i) / segments
    const k = Math.sqrt(Math.max(0, 1 - (y / R) * (y / R)))
    term.push(new THREE.Vector2(a * k, y))
    limbLit.push(new THREE.Vector2(litDir * R * k, y))
  }

  return shapeFromRing([...term, ...limbLit.slice().reverse()])
}

function lineLoop(
  points: THREE.Vector3[],
  color: number,
  opacity: number,
  renderOrder = 0,
): THREE.Line {
  const geo = new THREE.BufferGeometry().setFromPoints(points)
  const mat = new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity,
    depthWrite: false,
    depthTest: false,
  })
  const line = new THREE.Line(geo, mat)
  line.renderOrder = renderOrder
  return line
}

function fillMesh(shape: THREE.Shape, renderOrder = 0): THREE.Mesh | null {
  const geo = new THREE.ShapeGeometry(shape, 48)
  const mat = new THREE.MeshBasicMaterial({
    color: COLOR_GOLD,
    transparent: true,
    opacity: 0.88,
    side: THREE.DoubleSide,
    depthWrite: false,
    depthTest: false,
  })
  const mesh = new THREE.Mesh(geo, mat)
  mesh.renderOrder = renderOrder
  return mesh
}

/** 顶部为 i=0，顺时针排列 */
function orbitPosition(index: number, radius: number): THREE.Vector2 {
  const angle = Math.PI / 2 - index * (Math.PI / 4)
  return new THREE.Vector2(Math.cos(angle) * radius, Math.sin(angle) * radius)
}

function buildScene() {
  scene = new THREE.Scene()
  root = new THREE.Group()
  moonGroups = []

  // 轨道圆环（压淡，避免穿过月相抢视线）
  const orbit = lineLoop(circlePoints(ORBIT_RADIUS, 128), COLOR_GOLD, 0.18)
  root.add(orbit)

  // 中心装饰
  const center = lineLoop(circlePoints(CENTER_RADIUS, 32), COLOR_GOLD, 0.55)
  root.add(center)

  for (let i = 0; i < 8; i++) {
    const pos = orbitPosition(i, ORBIT_RADIUS)
    const moon = new THREE.Group()
    moon.position.set(pos.x, pos.y, 0)
    const phase = MOON_PHASES[i]

    // 亮面填充 + 外圆描边（不画晨昏线）
    const shape = moonPhaseShape(ICON_RADIUS, phase)
    if (shape) {
      const fill = fillMesh(shape, 0)
      if (fill) moon.add(fill)
    }
    moon.add(lineLoop(circlePoints(ICON_RADIUS, 64), COLOR_GOLD, 0.95, 1))

    root.add(moon)
    moonGroups.push(moon)
  }

  scene.add(root)
}

function fitCamera() {
  if (!camera || !canvasRef.value) return
  const w = canvasRef.value.clientWidth || window.innerWidth
  const h = canvasRef.value.clientHeight || window.innerHeight
  const aspect = w / Math.max(h, 1)
  // 让轨道完整落在视口内
  const view = ORBIT_RADIUS * 1.45
  camera.left = -view * aspect
  camera.right = view * aspect
  camera.top = view
  camera.bottom = -view
  camera.updateProjectionMatrix()
}

function disposeScene() {
  if (root && scene) {
    root.traverse((obj) => {
      const line = obj as THREE.Line
      if (line.geometry) line.geometry.dispose()
      if (line.material) {
        const mats = Array.isArray(line.material) ? line.material : [line.material]
        mats.forEach((m) => m.dispose())
      }
    })
    scene.remove(root)
  }
  root = null
  moonGroups = []
  if (renderer) {
    renderer.dispose()
    renderer = null
  }
  scene = null
  camera = null
  clock = null
}

function onResize() {
  if (!renderer || !camera || !canvasRef.value) return
  const w = canvasRef.value.clientWidth || window.innerWidth
  const h = canvasRef.value.clientHeight || window.innerHeight
  renderer.setSize(w, h, false)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  fitCamera()
}

function drawCanvas() {
  const canvas = canvasRef.value
  if (!canvas) return

  const width = canvas.clientWidth || window.innerWidth
  const height = canvas.clientHeight || window.innerHeight

  buildScene()
  camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 50)
  camera.position.set(0, 0, 10)
  camera.lookAt(0, 0, 0)
  fitCamera()

  renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: 'low-power',
  })
  renderer.setClearColor(COLOR_BG, 0.85)
  renderer.setSize(width, height, false)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))

  clock = new THREE.Clock()

  function animate() {
    animationId = requestAnimationFrame(animate)
    if (!renderer || !scene || !camera || !root || !clock) return
    const t = clock.getElapsedTime()

    // 整体缓慢自转
    root.rotation.z = t * 0.05

    // 月相轻微上下浮动
    for (let i = 0; i < moonGroups.length; i++) {
      const g = moonGroups[i]
      g.position.z = Math.sin(t * 0.9 + i * 0.7) * 0.04
    }

    renderer.render(scene, camera)
  }

  animate()

// 暂时禁用
// canvasReady.value = true
}

onMounted(() => {
  drawCanvas()
  resizeHandler = onResize
  window.addEventListener('resize', resizeHandler)
})

onBeforeUnmount(() => {
  if (resizeHandler) window.removeEventListener('resize', resizeHandler)
  cancelAnimationFrame(animationId)
  disposeScene()
})
</script>

<style scoped>
.page {
  width: 100%;
  min-height: 100%;
  overflow-y: auto;
  position: relative;
  z-index: 1;
}
.bg-layer {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}
.bg-canvas {
  width: 100%;
  height: 100%;
  display: block;
}
.content {
  position: relative;
  max-width: 780px;
  margin: 0 auto;
  padding: 56px 28px 80px;
  z-index: 1;
}
.header {
  margin-bottom: 56px;
}
.page-title {
  font-size: 32px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 12px;
  letter-spacing: -0.02em;
}
.page-subtitle {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.7;
  max-width: 600px;
}
.section {
  margin-bottom: 56px;
}
.section-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}
.section-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}
.section-period {
  font-size: 13px;
  color: var(--text-muted);
  margin-left: auto;
}
.badge {
  font-size: 12px;
  padding: 4px 12px;
  border-radius: 999px;
}
.badge--blue {
  color: var(--primary-color);
  background: var(--tag-bg);
  border: 1px solid var(--tag-border);
}
.cards {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.edu-card {
  background: var(--glass-bg);
  backdrop-filter: blur(12px);
  border: 1px solid var(--glass-border);
  border-radius: 16px;
  padding: 28px;
}
.edu-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}
.edu-school {
  font-size: 17px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}
.edu-period {
  font-size: 13px;
  color: var(--text-muted);
}
.edu-degree {
  font-size: 13.5px;
  color: var(--text-secondary);
  margin: 0 0 16px;
}
.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.fade-in {
  animation: fadeIn 0.6s ease both;
}
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
