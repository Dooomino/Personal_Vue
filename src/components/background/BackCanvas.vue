<template>
  <div class="w-full h-full">
    <canvas ref="canvasRef"></canvas>
  </div>
</template>
<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js";
import { DRACOLoader, GLTFLoader, OBJLoader } from 'three/examples/jsm/Addons.js';
import { SketchOutlineShader } from './shaders/moebius';
import { useThemeStore } from '@/stores/theme';
import { Stage } from './entities/Stage';

// 抽离的颜色插值工具类
class ColorInterpolator {
  static interpolateColors(fromColor: THREE.Color, toColor: THREE.Color, progress: number, targetColor: THREE.Color): void {
    // 确保 progress 在 0-1 范围内
    progress = Math.max(0, Math.min(1, progress));

    // 使用 THREE.Color.lerpColors 静态方法进行插值
    THREE.Color.lerpColors(fromColor, toColor, progress, targetColor);
  }

  static areColorsAlmostEqual(color1: THREE.Color, color2: THREE.Color, threshold: number = 0.001): boolean {
    const delta = Math.sqrt(
      Math.pow(color1.r - color2.r, 2) +
      Math.pow(color1.g - color2.g, 2) +
      Math.pow(color1.b - color2.b, 2)
    );
    return delta < threshold;
  }

  static calculateProgress(startTime: number, currentTime: number, duration: number): number {
    const elapsed = (currentTime - startTime) / 1000; // 转换为秒
    return Math.min(elapsed / duration, 1.0);
  }
}

class BackCanvas {
  canvas: HTMLCanvasElement
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  renderer: THREE.WebGLRenderer
  controls: OrbitControls
  isDarkTheme: boolean = false
  stage: Stage
  objs: THREE.Object3D[] = []

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    )
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas })
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.setPixelRatio(window.devicePixelRatio)
    this.renderer.setClearColor(0x1e1e1e, 0)
    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enableDamping = true
    this.controls.enablePan = false
    this.controls.enableZoom = false
    this.controls.enableRotate = false
    this.camera.position.set(0, 10, 10)
    this.controls.update()

    this.stage = new Stage("stage",themeStore.isDarkMode)

    this.initScene()
    this.setStage()
  }
  toggleControls(isOn: boolean){
    this.controls.enablePan = isOn
    this.controls.enableRotate = isOn
    this.controls.enableZoom = isOn
    this.controls.update()
  }
  initScene(){
    const scene = this.scene
    scene.add(this.camera)
  }
  setStage(){
    const scene = this.scene
    scene.add(this.stage.stage)
  }
  getStage(){
    return this.stage
  }
}

const canvasRef = ref<HTMLCanvasElement | null>(null)
const backCanvasRef = ref<BackCanvas | null>(null)
const themeStore = useThemeStore()
let animationFrameId: number

onMounted(() => {
  if (canvasRef.value) {
    const backCanvas = new BackCanvas(canvasRef.value)
    backCanvasRef.value = backCanvas

    setupStage();
    // 添加动画循环
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate)
      backCanvas.controls.update()
      backCanvas.renderer.render(backCanvas.scene, backCanvas.camera)
    }
    animate()
    // 处理窗口大小调整
    const handleResize = () => {
      backCanvas.camera.aspect = window.innerWidth / window.innerHeight
      backCanvas.camera.updateProjectionMatrix()
      backCanvas.renderer.setSize(window.innerWidth, window.innerHeight)
    }

    window.addEventListener('resize', handleResize)
  }
})
async function setupStage() {
  const stage = backCanvasRef.value?.getStage() || null
  // TEST
    backCanvasRef.value?.toggleControls(true)
  if(stage){
    stage.add(new THREE.AmbientLight(0xffffff, 0.5))
    stage.addColorPair("box", 0x020D45,0x0730FF)
    // Room
    // const roomGeo = new THREE.BoxGeometry(50, 30, 50)
    const objLoader = new OBJLoader()
    await objLoader.load('../../assets/model/room.obj',(roomGeo:THREE.Object3D)=>{
      const boxColor =  stage.colors["box"].getColor()
      const roomMat = new THREE.MeshBasicMaterial({
        color: boxColor,
        side: THREE.DoubleSide,
      })
      const room = new THREE.Mesh(roomGeo, roomMat)
      room.scale.set(40,30,30)
      room.position.set(0, 0, 0)
      stage.add(room,'room')
    })
    // light
    const light = new THREE.PointLight(0xffffff, 1)
    light.position.set(0, 10, 0)
    stage.add(light)

  }
}

// 监听主题变化
themeStore.$subscribe((mutation, state) => {
  if (backCanvasRef.value) {
    backCanvasRef.value.isDarkTheme = state.isDarkMode
    // 切换Stage中的所有颜色
    const stage = backCanvasRef.value.getStage()
    if (stage) {
      stage.switchTheme(state.isDarkMode)
      // 更新已存在的对象的颜色
      updateStageObjectsColor(stage)
    }
  }
})

function updateStageObjectsColor(stage: Stage) {
  // 更新room的颜色
  const room = stage.get('room')
  if (room && room instanceof THREE.Mesh) {
    const materials = Array.isArray(room.material) ? room.material : [room.material]
    const boxColor = stage.colors["box"]?.getColor()
    if (boxColor) {
      materials.forEach(mat => {
        if (mat && mat instanceof THREE.MeshBasicMaterial) {
          mat.color.copy(boxColor)
        }
      })
    }
  }
}

onUnmounted(() => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
  }
})
</script>
