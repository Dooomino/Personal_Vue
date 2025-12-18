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
    // const roomGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const boxColor = stage.colors["box"].getColor();
    // const roomMat = new THREE.MeshPhysicalMaterial({
    //   color: boxColor,
    //   side: THREE.DoubleSide,
    //   wireframe: false,
    //   transparent: true,
    //   opacity: 1,
    //   ior: 0.9,
    //   reflectivity: 0.8,
    //   metalness: 0,
    //   roughness: 1,
    // });
    const roomMat = new THREE.ShaderMaterial({
      fragmentShader: SketchOutlineShader.fragmentShader,
      vertexShader: SketchOutlineShader.vertexShader,
      uniforms: SketchOutlineShader.uniforms,
    })
    roomMat.uniforms.outlineThickness.value = 1.0;
    roomMat.uniforms.outlineColor.value = new THREE.Color(0xffffff);

    // @ts-expect-error 缺少属性
    room.material = roomMat

    // const room = new THREE.Mesh(roomGeo, roomMat);
    room.scale.set(40, 30, 30);
    room.position.set(0, 0, 0);
    room.receiveShadow = true;
    room.castShadow = true;

    stage.add(room, 'room');
    // light
    // const light = new THREE.SpotLight(0xffffff, 100.0 , 180.0, Math.PI / 6,0.8,100)
    const light = new THREE.DirectionalLight(0xffffff, 10.0);
    light.scale.set(10,10,10)
    light.castShadow = true
    light.shadow.mapSize.width = 2048;
    light.shadow.mapSize.height = 2048;
    light.shadow.camera.left = -50;
    light.shadow.camera.right = 50;
    light.shadow.camera.top = 50;
    light.shadow.camera.bottom = -50;
    light.shadow.camera.near = 0.5;
    light.shadow.camera.far = 500;
    // 启用shadow map优化
    light.shadow.bias = -0.005;
    light.shadow.radius = 1;

    const lightObjectGeo = new THREE.SphereGeometry(1, 16, 16);
    const lightObjectMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
    });
    const lightObject = new THREE.Mesh(lightObjectGeo, lightObjectMat);
    lightObject.castShadow = false; // 光源物体本身不需要投射阴影
    const lightTarget = new THREE.Object3D();
    light.position.set(-200, 5, -55)
    lightTarget.position.set(0, 0, 0); // 将光源目标设为原点
    light.target = lightTarget
    lightObject.position.set(light.position.x, light.position.y, light.position.z)
    // const lightHelper = new THREE.DirectionalLightHelper(light, 5);
    // const dir = lightTarget.position.clone().sub(light.position).normalize()
    // const lightDirworldHelper = new THREE.ArrowHelper(dir,light.position, 5, 0xffffff, 1);
    const lightHelper = new THREE.DirectionalLightHelper(light);
    stage.add(light,'light')
    stage.add(lightObject, 'lightObject');
    stage.add(lightTarget, 'lightTarget');
    stage.add(lightHelper, 'lightHelper');
    // stage.add(lightDirworldHelper, 'lightDirworldHelper');
    // stage.add(lightHelper, 'lightHelper');

    // 将点光源替换为区域光
    const areaLightGeometry = new THREE.PlaneGeometry(20, 20);
    const areaLightMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8
    });
    const areaLight = new THREE.Mesh(areaLightGeometry, areaLightMaterial);

    // 添加一个轻微的发光效果
    const areaLightGlowGeometry = new THREE.PlaneGeometry(25, 25);
    const areaLightGlowMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.3
    });
    const areaLightGlow = new THREE.Mesh(areaLightGlowGeometry, areaLightGlowMaterial);

    // 设置区域光的位置和朝向
    areaLight.position.set(0, 20, 0);
    areaLight.rotation.x = -Math.PI / 2;
    areaLightGlow.position.set(0, 20, 0);
    areaLightGlow.rotation.x = -Math.PI / 2;

    // 添加到场景中
    stage.add(areaLight, 'areaLight');
    stage.add(areaLightGlow, 'areaLightGlow');

    // 移除原来的室内点光源
    // const indoorLight = new THREE.PointLight(0xffffff, 50);
    // indoorLight.position.set(0, 0, 0);
    // stage.add(indoorLight, 'indoorLight');

  }
}

function updateStage() {
  if (backCanvasRef.value) {
    const stage = backCanvasRef.value.getStage()
    if (stage) {
      const light = stage.get('light') as THREE.DirectionalLight
      const lightObject = stage.get('lightObject')
      const lightHelper = stage.get('lightHelper')as THREE.DirectionalLightHelper
      // rotate around 0,0,0
      if (light) {
        // 使用更大的半径，并保持合适的高度，避免光源穿过模型
        const radius = 200; // 增加半径使光源远离中心
        const height = 5; // 调整高度避免穿过地面
        const speed = 0.2; // 降低旋转速度使动画更平滑
        light.position.x = radius * Math.sin(Date.now() / 1000 * speed)
        light.position.y = height
        light.position.z = radius * Math.cos(Date.now() / 1000 * speed)
        lightHelper?.update()
        // 更新光源目标位置，确保光照方向正确
        if (light.target) {
          light.target.position.set(0, 0, 0);
        }

      }

      // 更新区域光的位置，使其跟随主光源移动
      const areaLight = stage.get('areaLight') as THREE.Mesh;
      const areaLightGlow = stage.get('areaLightGlow') as THREE.Mesh;
      if (light && areaLight && areaLightGlow) {
        // 计算区域光应该面向的方向（朝向原点）
        const direction = new THREE.Vector3().subVectors(
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(light.position.x, light.position.y, light.position.z)
        ).normalize();

        // 设置区域光的朝向
        areaLight.lookAt(0, 0, 0);
        areaLightGlow.lookAt(0, 0, 0);

        // 区域光的位置稍微偏离主光源，创造更好的视觉效果
        const offset = direction.multiplyScalar(5);
        areaLight.position.set(
          light.position.x + offset.x,
          light.position.y + offset.y,
          light.position.z + offset.z
        );
        areaLightGlow.position.copy(areaLight.position);
      }

      lightObject?.position.copy(light?.position)
      const ambientLight = stage.get('ambient') as THREE.AmbientLight
      if (ambientLight) {
        ambientLight.intensity = ambientLight.intensity * (themeStore.isDarkMode ? 0.5 : 1)
      }

      updateUniforms()
    }
  }

}
function updateUniforms(){
  if (backCanvasRef.value) {
    const { camera } = backCanvasRef.value
    const stage = backCanvasRef.value.getStage()
    const light = stage.get('light') as THREE.DirectionalLight
    if (stage) {
      const room = stage.get('room') as THREE.Mesh
      if(room){
        const roomMat = room.material as THREE.ShaderMaterial
        roomMat.uniforms.objectColor.value = stage.colors["box"].getColor()
        roomMat.uniforms.cameraPosition.value = camera.position
        roomMat.uniforms.lightPosition.value = light.position
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

        roomMat.needsUpdate = true
      }
    }
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
