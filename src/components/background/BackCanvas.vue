<template>
  <div class="w-full h-full">
    <canvas ref="canvasRef"></canvas>
  </div>
  <div class="absolute bottom-30 right-30">
    <button @click="test()">
      TEST
    </button>
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
import { SimpleShader } from './shaders/simple';

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
    this.renderer.shadowMap.enabled = true
    // 使用更好的阴影类型
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enableDamping = true
    this.controls.enablePan = false
    this.controls.enableZoom = false
    this.controls.enableRotate = false
    this.controls.zoomSpeed = 1.5
    this.camera.position.set(10, 10, 10)
    this.camera.lookAt(-60, 10, -30)
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
      updateStage()
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
function loadGLB(url: string){
  const loader = new GLTFLoader();
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath('./lib/draco/gltf/');
  loader.setDRACOLoader(dracoLoader);
  return new Promise((resolve, reject) => {
    loader.load(url, (gltf) => {
      gltf.scene.scale.set(1,1,1);
      resolve(gltf.scene.children[0]);
    }, undefined, (error) => {
      console.error('加载失败:', error);
      reject(error);
    });
  })
}
async function setupStage() {
  const stage = backCanvasRef.value?.getStage() || null
  // TEST
    backCanvasRef.value?.toggleControls(true)
  if(stage){
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    stage.add(ambientLight,'ambient');

    stage.addColorPair("box", 0x020D45,0x0730FF)
    // Room

    const room = await loadGLB('/src/assets/model/room.glb') as THREE.Object3D
    const boxColor = stage.colors["box"].getColor();
    const roomMat = new THREE.ShaderMaterial({
      fragmentShader: SketchOutlineShader.fragmentShader,
      vertexShader: SketchOutlineShader.vertexShader,
      uniforms: SketchOutlineShader.uniforms,
    })
    roomMat.uniforms.outlineThickness.value = 1.0;
    roomMat.uniforms.outlineColor.value = new THREE.Color(0xffffff);

    // @ts-expect-error 缺少属性
    room.material = roomMat

    room.scale.set(40, 30, 30);
    room.position.set(0, 0, 0);
    room.receiveShadow = true;
    room.castShadow = true;

    stage.add(room, 'room');

    // 添加一个更亮的环境光，增强整体照明
    const brightAmbientLight = new THREE.AmbientLight(0xffffff, 0.8);
    stage.add(brightAmbientLight, 'brightAmbient');

    // 主方向光 - 模拟阳光透过窗户
    const sunLight = new THREE.DirectionalLight(0xffffff, 8.0);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.left = -50;
    sunLight.shadow.camera.right = 50;
    sunLight.shadow.camera.top = 50;
    sunLight.shadow.camera.bottom = -50;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 500;
    sunLight.shadow.bias = -0.005;
    sunLight.shadow.radius = 1;

    // 将光源放在房间外，模拟从窗户照射进来
    // sunLight.position.set(10, 5, 100);
    // const sunLightTarget = new THREE.Object3D();
    // sunLightTarget.position.set(0, 0, 0);
    // sunLight.target = sunLightTarget;

    // // 光源可视对象
    // const sunLightObjectGeo = new THREE.SphereGeometry(2, 16, 16);
    // const sunLightObjectMat = new THREE.MeshBasicMaterial({
    //   color: 0xffff00,
    // });
    // const sunLightObject = new THREE.Mesh(sunLightObjectGeo, sunLightObjectMat);
    // sunLightObject.position.copy(sunLight.position);

    // stage.add(sunLight, 'sunLight');
    // stage.add(sunLightTarget, 'sunLightTarget');
    // stage.add(sunLightObject, 'sunLightObject');

    // 室内补光灯，模拟室内光源
    const indoorLight = new THREE.PointLight(0xffffff, 2.0, 100);
    indoorLight.position.set(0, 10, 0);
    indoorLight.castShadow = true;
    stage.add(indoorLight, 'indoorLight');

    // 添加一个轻微的发光效果表示窗户透光
    const windowLightGeometry = new THREE.PlaneGeometry(30, 20);
    const windowLightMaterial = new THREE.MeshBasicMaterial({
      color: 0x66ccff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.3
    });
    const windowLight = new THREE.Mesh(windowLightGeometry, windowLightMaterial);
    windowLight.position.set(-30, 10, 30); // 放在房间的"墙壁"位置，模拟窗户
    windowLight.rotation.x = Math.PI / 2;
    stage.add(windowLight, 'windowLight');
  }
}

function updateStage() {
  if (backCanvasRef.value) {
    const stage = backCanvasRef.value.getStage()
    if (stage) {
      // 更新太阳光位置，模拟一天中的太阳运动
      const sunLight = stage.get('sunLight') as THREE.DirectionalLight
      const sunLightObject = stage.get('sunLightObject')

      if (sunLight) {
        // 太阳在天空中缓慢移动，模拟自然光照变化
        const time = Date.now() / 10000; // 放慢时间以观察效果
        sunLight.position.x = 100 * Math.sin(time);
        sunLight.position.y = 50 + 30 * Math.cos(time * 0.5); // 上下移动
        sunLight.position.z = 100 * Math.cos(time);

        // 更新光源目标
        if (sunLight.target) {
          (sunLight.target as THREE.Object3D).position.set(0, 0, 0);
        }

        // 更新光源可视化对象位置
        sunLightObject?.position.copy(sunLight.position);
      }

      // 更新窗户光效的位置和强度
      const windowLight = stage.get('windowLight') as THREE.Mesh;
      if (windowLight) {
        // 根据太阳位置调整窗户光效
        const sunIntensity = Math.max(0.1, (sunLight?.position.y || 0) / 80);
        (windowLight.material as THREE.MeshBasicMaterial).opacity = 0.2 + sunIntensity * 0.3;
      }

      updateUniforms()
    }
  }
}

function updateUniforms(){
  if (backCanvasRef.value) {
    const { camera } = backCanvasRef.value
    const stage = backCanvasRef.value.getStage()
    const light = stage.get('indoorLight') as THREE.DirectionalLight
    if (stage) {
      const room = stage.get('room') as THREE.Mesh
      if(room && room.material){
        const roomMat = room.material as THREE.ShaderMaterial
        roomMat.uniforms.objectColor.value = stage.colors["box"].getColor()
        roomMat.uniforms.cameraPosition.value = camera.position
        roomMat.uniforms.lightPosition.value = light?.position || new THREE.Vector3(1, 1, 1)
        roomMat.uniforms.resolution.value = new THREE.Vector2(window.innerWidth, window.innerHeight)
        roomMat.uniforms.cameraNear.value = camera.near;
        roomMat.uniforms.cameraFar.value = camera.far;

        // 更新区域光相关的uniforms
        const areaLight = stage.get('areaLight') as THREE.Mesh
        if (areaLight) {
          roomMat.uniforms.areaLightPosition.value = areaLight.position
          roomMat.uniforms.areaLightColor.value = new THREE.Color(0xffffff)
          roomMat.uniforms.areaLightIntensity.value = 1.0
        }

        // 更新窗户光相关的uniforms
        const windowLight = stage.get('windowLight') as THREE.Mesh
        if (windowLight) {
          roomMat.uniforms.windowLightPosition.value = windowLight.position
          roomMat.uniforms.windowLightColor.value = new THREE.Color(0x66ccff)
          roomMat.uniforms.windowLightIntensity.value = 1.0
        }

        roomMat.needsUpdate = true
      }
    }
  }
}
function test(){
  console.log(backCanvasRef.value?.camera.rotation)

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
