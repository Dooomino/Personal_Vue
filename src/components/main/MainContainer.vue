<template>
  <div
    class="u-h-full u-w-full main"
    @pointermove="handlePointerMove"
    @pointerleave="handlePointerLeave"
    @pointerdown="handlePointerDown"
    @pointerup="handlePointerUp"
    @pointercancel="handlePointerUp"
  >
    <canvas ref="canvas" class="u-h-full u-w-full"></canvas>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import * as THREE from 'three'

/** 网格规模（远小于原先 128×128，作为页面背景足够填满画面） */
const COLS = 36
const ROWS = 22
const CELL = 1.0
/** 间距收紧，块与块几乎贴合 */
const BOX_XZ = 0.98
/** 静息高度（近景下柱体要立得住） */
const BOX_Y = 2.6
const COUNT = COLS * ROWS

/** 主体上下位移幅度与影响半径（世界单位） */
const MAX_LIFT = 4.8
const INFLUENCE = 8
const BOB_AMPLITUDE = ROWS * CELL * 0.28
/** 正交视窗相对整网的缩放：越大越“远”，能看到更多柱体 */
const VIEW_ZOOM = 0.7
/** 点击下沉：按住左键持续施加，松开后衰减 */
const MAX_SINK = MAX_LIFT * 0.95
const SINK_RADIUS = 5.5
const SINK_RELEASE = 0.45
const SINK_ATTACK = 0.12

const canvas = ref<HTMLCanvasElement | null>(null)

let renderer: THREE.WebGLRenderer | null = null
let scene: THREE.Scene | null = null
let camera: THREE.OrthographicCamera | null = null
let instanced: THREE.InstancedMesh | null = null
let ground: THREE.Mesh | null = null
let clock: THREE.Clock | null = null
let boxMat: THREE.MeshPhongMaterial | null = null
let depthMat: THREE.MeshDepthMaterial | null = null
let rafId = 0
let resizeHandler: (() => void) | null = null

/** 鼠标 NDC → 地面平面（y=0）世界坐标，作为动画中心 */
const pointerNdc = new THREE.Vector2(0, 0)
const hasPointer = ref(false)
const focusTarget = new THREE.Vector3(0, 0, 0)
const focusSmooth = new THREE.Vector3(0, 0, 0)
const raycaster = new THREE.Raycaster()
const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
const hitPoint = new THREE.Vector3()

function projectPointer(e: PointerEvent) {
  if (!canvas.value) return false
  const rect = canvas.value.getBoundingClientRect()
  if (rect.width === 0 || rect.height === 0) return false
  pointerNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
  pointerNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
  return true
}

function handlePointerMove(e: PointerEvent) {
  if (projectPointer(e)) hasPointer.value = true
  if (isSinkHeld.value) syncSinkFromPointer()
}

function handlePointerLeave() {
  hasPointer.value = false
  // 按住拖出画面时仍保持下沉，直到 pointerup
}

/** 左键按下：开始持续下沉，位置跟随指针 */
function handlePointerDown(e: PointerEvent) {
  if (e.button !== 0 || !camera || !projectPointer(e)) return
  hasPointer.value = true
  isSinkHeld.value = true
  const el = e.currentTarget as HTMLElement | null
  el?.setPointerCapture?.(e.pointerId)
  syncSinkFromPointer()
}

function handlePointerUp(e?: PointerEvent) {
  if (!isSinkHeld.value) return
  isSinkHeld.value = false
  if (e) {
    const el = e.currentTarget as HTMLElement | null
    try {
      el?.releasePointerCapture?.(e.pointerId)
    } catch {
      /* capture may already be released */
    }
  }
}

function syncSinkFromPointer() {
  if (!camera) return
  raycaster.setFromCamera(pointerNdc, camera)
  if (raycaster.ray.intersectPlane(groundPlane, hitPoint)) {
    uniforms.uSinkPos.value.set(hitPoint.x, 0, hitPoint.z)
  }
}

/** 左键是否按住（驱动持续下沉） */
const isSinkHeld = ref(false)
/** 下沉强度 0..1，按下快攻、松开缓释 */
let sinkStrength = 0

/** 每帧只改这些 uniform，高度在 GPU 里算 */
const uniforms = {
  uTime: { value: 0 },
  uFocus: { value: new THREE.Vector3(0, 0, 0) },
  uMaxLift: { value: MAX_LIFT },
  uInfluence: { value: INFLUENCE },
  uBobAmp: { value: BOB_AMPLITUDE },
  uBoxY: { value: BOX_Y },
  uSinkPos: { value: new THREE.Vector3(0, 0, 0) },
  uSinkStrength: { value: 0 },
  uSinkRadius: { value: SINK_RADIUS },
  uMaxSink: { value: MAX_SINK },
}

/** 颜色材质与深度材质共用同一套高度逻辑，保证阴影对齐 */
const HEIGHT_PARS = /* glsl */ `
uniform float uTime;
uniform vec3 uFocus;
uniform float uMaxLift;
uniform float uInfluence;
uniform float uBobAmp;
uniform float uBoxY;
uniform vec3 uSinkPos;
uniform float uSinkStrength;
uniform float uSinkRadius;
uniform float uMaxSink;

float pillarLift(vec2 cell) {
  vec2 d = cell - uFocus.xz;
  float dist = length(d);

  float lift = 0.0;
  if (dist < uInfluence) {
    float fall = 1.0 - dist / uInfluence;
    float dome = cos(dist / uInfluence * PI * 0.5);
    float n =
      sin(cell.x * 1.7 + uTime * 1.4) * 0.35 +
      sin(cell.y * 2.3 - uTime * 1.1) * 0.25 +
      sin((cell.x + cell.y) * 0.9 + uTime * 0.7) * 0.2;
    float bob = 0.55 + uFocus.y / (uBobAmp * 2.0 + 0.001);
    lift = max(dome * uMaxLift * bob + n * fall * 0.6, 0.0);
  }

  // 点击下沉：与抬升同构的穹顶，方向相反
  if (uSinkStrength > 0.001) {
    float sd = length(cell - uSinkPos.xz);
    if (sd < uSinkRadius) {
      float sFall = 1.0 - sd / uSinkRadius;
      float sDome = cos(sd / uSinkRadius * PI * 0.5);
      float sn =
        sin(cell.x * 1.9 + uTime * 1.6) * 0.3 +
        sin(cell.y * 2.1 - uTime * 1.2) * 0.22 +
        sin((cell.x - cell.y) * 1.1 + uTime * 0.8) * 0.18;
      lift -= sDome * uMaxSink * uSinkStrength + sn * sFall * 0.55 * uSinkStrength;
    }
  }

  // 下沉最多压到地平面（h ≥ 0），不再穿到 y=0 以下
  return max(lift, -uBoxY);
}
`

const HEIGHT_VERTEX = /* glsl */ `
#ifdef USE_INSTANCING
  vec2 cellXZ = vec2(instanceMatrix[3].x, instanceMatrix[3].z);
#else
  vec2 cellXZ = position.xz;
#endif
float liftH = pillarLift(cellXZ);
// 限制在地平面以上；保留极小厚度，避免与地面共面闪烁
float h = max(uBoxY + liftH, 0.02);
transformed.y *= h / uBoxY;
`

/** 阴影 pass 与颜色 pass 同一套高度（均限制在地平面以上） */
const HEIGHT_VERTEX_SHADOW = HEIGHT_VERTEX

function patchVertexShader(
  shader: THREE.WebGLProgramParametersWithUniforms,
  forShadow = false,
) {
  shader.uniforms.uTime = uniforms.uTime
  shader.uniforms.uFocus = uniforms.uFocus
  shader.uniforms.uMaxLift = uniforms.uMaxLift
  shader.uniforms.uInfluence = uniforms.uInfluence
  shader.uniforms.uBobAmp = uniforms.uBobAmp
  shader.uniforms.uBoxY = uniforms.uBoxY
  shader.uniforms.uSinkPos = uniforms.uSinkPos
  shader.uniforms.uSinkStrength = uniforms.uSinkStrength
  shader.uniforms.uSinkRadius = uniforms.uSinkRadius
  shader.uniforms.uMaxSink = uniforms.uMaxSink
  const vertex = forShadow ? HEIGHT_VERTEX_SHADOW : HEIGHT_VERTEX
  shader.vertexShader = shader.vertexShader
    .replace('#include <common>', `#include <common>\n${HEIGHT_PARS}`)
    .replace('#include <begin_vertex>', `#include <begin_vertex>\n${vertex}`)
}

function fitCamera() {
  if (!camera || !canvas.value) return
  const w = canvas.value.clientWidth
  const h = canvas.value.clientHeight
  if (w === 0 || h === 0) return

  const aspect = w / h
  const gridW = COLS * CELL
  const gridH = ROWS * CELL
  let viewH: number
  let viewW: number
  if (aspect >= gridW / gridH) {
    viewH = gridH
    viewW = viewH * aspect
  } else {
    viewW = gridW
    viewH = viewW / aspect
  }

  viewW *= VIEW_ZOOM
  viewH *= VIEW_ZOOM

  camera.left = -viewW / 2
  camera.right = viewW / 2
  camera.top = viewH / 2
  camera.bottom = -viewH / 2
  camera.updateProjectionMatrix()
}

function disposeScene() {
  if (instanced) {
    instanced.geometry.dispose()
    scene?.remove(instanced)
    instanced = null
  }
  if (boxMat) {
    boxMat.dispose()
    boxMat = null
  }
  if (depthMat) {
    depthMat.dispose()
    depthMat = null
  }
  if (ground) {
    ground.geometry.dispose()
    ;(ground.material as THREE.Material).dispose()
    scene?.remove(ground)
    ground = null
  }
  if (renderer) {
    renderer.dispose()
    renderer.forceContextLoss()
    renderer = null
  }
  scene = null
  camera = null
  clock = null
}

onMounted(() => {
  if (!canvas.value) return

  scene = new THREE.Scene()

  // 正交斜视：位置后移 + 更大视窗，画面更“远”
  camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 260)
  camera.position.set(0, 62, 70)
  camera.lookAt(0, 2.0, 0)
  fitCamera()

  // 盒底贴 y=0，高度只在 shader 里沿 +Y 缩放
  const boxGeo = new THREE.BoxGeometry(BOX_XZ, BOX_Y, BOX_XZ)
  boxGeo.translate(0, BOX_Y * 0.5, 0)

  boxMat = new THREE.MeshPhongMaterial({
    color: 0xffffff,
    specular: 0x222222,
    shininess: 18,
    flatShading: false,
  })
  boxMat.onBeforeCompile = (shader) => patchVertexShader(shader, false)

  // 阴影 pass 必须用同一套高度逻辑，但禁止地面以下投影
  depthMat = new THREE.MeshDepthMaterial({
    depthPacking: THREE.RGBADepthPacking,
  })
  depthMat.onBeforeCompile = (shader) => patchVertexShader(shader, true)

  instanced = new THREE.InstancedMesh(boxGeo, boxMat, COUNT)
  instanced.castShadow = true
  instanced.receiveShadow = true
  instanced.customDepthMaterial = depthMat

  const dummy = new THREE.Object3D()
  const startX = -((COLS - 1) * CELL) / 2
  const startZ = -((ROWS - 1) * CELL) / 2
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const i = row * COLS + col
      dummy.position.set(startX + col * CELL, 0, startZ + row * CELL)
      dummy.scale.set(1, 1, 1)
      dummy.updateMatrix()
      instanced.setMatrixAt(i, dummy.matrix)
    }
  }
  // 实例矩阵只写一次；之后不再每帧上传
  instanced.instanceMatrix.needsUpdate = true
  scene.add(instanced)

  // 阴影接收面：不透明，避免半透明与阴影叠成大块死黑
  const groundSize = Math.max(COLS, ROWS) * CELL * 2
  const groundGeo = new THREE.PlaneGeometry(groundSize, groundSize)
  const groundMat = new THREE.MeshPhongMaterial({
    color: 0x3a4f44,
    specular: 0x000000,
    shininess: 0,
  })
  ground = new THREE.Mesh(groundGeo, groundMat)
  ground.rotation.x = -Math.PI / 2
  ground.position.y = 0
  ground.receiveShadow = true
  scene.add(ground)

  // 主光更接近顶光：侧向投影变短，坑底不容易被整片盖黑
  const keyLight = new THREE.DirectionalLight(0xffffff, 1.05)
  keyLight.position.set(6, 36, 12)
  keyLight.target.position.set(0, 0, 0)
  keyLight.castShadow = true
  keyLight.shadow.mapSize.set(2048, 2048)
  keyLight.shadow.camera.near = 8
  keyLight.shadow.camera.far = 80
  const s = 14
  keyLight.shadow.camera.left = -s
  keyLight.shadow.camera.right = s
  keyLight.shadow.camera.top = s
  keyLight.shadow.camera.bottom = -s
  keyLight.shadow.camera.updateProjectionMatrix()
  keyLight.shadow.bias = -0.0003
  keyLight.shadow.normalBias = 0.15
  keyLight.shadow.radius = 2.5
  // 影子浓度（Three r165+）
  keyLight.shadow.intensity = 0.85
  scene.add(keyLight)
  scene.add(keyLight.target)

  // 环境 + 半球光，阴影区保留底色
  const fill = new THREE.AmbientLight(0xb8cfc4, 0.55)
  scene.add(fill)
  const hemi = new THREE.HemisphereLight(0xd2e0d8, 0x1a2a22, 0.55)
  scene.add(hemi)

  renderer = new THREE.WebGLRenderer({
    canvas: canvas.value,
    alpha: true,
    antialias: true,
    powerPreference: 'high-performance',
  })
  renderer.setClearColor(0x000000, 0)
  renderer.setSize(canvas.value.clientWidth, canvas.value.clientHeight, false)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5))
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap

  clock = new THREE.Clock()

  function animate() {
    rafId = requestAnimationFrame(animate)
    if (!renderer || !scene || !camera || !clock) return

    const dt = Math.min(clock.getDelta(), 0.05)
    const t = clock.getElapsedTime()

    // 平面坐标：有指针时用射线投到 y=0；离开后回到缓慢漂移
    if (hasPointer.value) {
      raycaster.setFromCamera(pointerNdc, camera)
      if (raycaster.ray.intersectPlane(groundPlane, hitPoint)) {
        focusTarget.x = hitPoint.x
        focusTarget.z = hitPoint.z
      }
    } else {
      focusTarget.x = Math.sin(t * 0.35) * (COLS * CELL * 0.22)
      focusTarget.z = Math.cos(t * 0.27) * (ROWS * CELL * 0.18)
    }
    // 高度方向仍保留独立起伏，不跟鼠标
    focusTarget.y = Math.sin(t * 0.9) * BOB_AMPLITUDE

    // 指针移动时平滑跟随，避免焦点生硬跳变
    const k = 1 - Math.exp(-10 * dt)
    focusSmooth.lerp(focusTarget, k)

    // CPU 只更新焦点；柱体高度 / 噪声在 vertex shader
    uniforms.uTime.value = t
    uniforms.uFocus.value.copy(focusSmooth)

    // 按住左键持续下沉：快攻到 1，松开后缓释到 0；按住时位置跟随指针
    if (isSinkHeld.value) {
      syncSinkFromPointer()
      sinkStrength = Math.min(1, sinkStrength + dt / SINK_ATTACK)
    } else {
      sinkStrength = Math.max(0, sinkStrength - dt / SINK_RELEASE)
    }
    uniforms.uSinkStrength.value = sinkStrength
    uniforms.uSinkRadius.value = SINK_RADIUS * (0.8 + 0.2 * sinkStrength)

    renderer.render(scene, camera)
  }
  animate()

  resizeHandler = () => {
    if (!camera || !renderer || !canvas.value) return
    fitCamera()
    renderer.setSize(canvas.value.clientWidth, canvas.value.clientHeight, false)
  }
  window.addEventListener('resize', resizeHandler)
})

onUnmounted(() => {
  cancelAnimationFrame(rafId)
  rafId = 0
  if (resizeHandler) {
    window.removeEventListener('resize', resizeHandler)
    resizeHandler = null
  }
  disposeScene()
})
</script>

<style scoped>
.main {
  background: linear-gradient(to bottom, #33554488 0%, rgba(255, 255, 255, 0) 100%);
  animation: fadeIn 0.6s ease-out;
  cursor: crosshair;
  touch-action: none;
  user-select: none;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    background: linear-gradient(to bottom, #00000088 0%, rgba(255, 255, 255, 0) 100%);
    transform: translateY(1%);
  }

  to {
    opacity: 1;
    background: linear-gradient(to bottom, #33554488 0%, rgba(255, 255, 255, 0) 100%);
    transform: translateY(0);
  }
}
</style>
