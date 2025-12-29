<template>
  <div class="w-full h-full">
    <canvas ref="canvasRef"></canvas>
  </div>
</template>
<script lang="ts">
import * as THREE from 'three'
const scene = new THREE.Scene()
let camera =  {} as THREE.PerspectiveCamera;

</script>
<script setup lang="ts">
import { getCurrentInstance, onMounted, onUnmounted, ref, type ComponentInternalInstance } from 'vue'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js";
import { DRACOLoader, GLTFLoader, OBJLoader } from 'three/examples/jsm/Addons.js';
import MoebiusPass from './shaders/moebius';
import { useThemeStore } from '@/stores/theme';
import { Stage } from './entities/Stage';
import { SimpleShader } from './shaders/simple';
import { EffectComposer, RenderPass } from 'postprocessing';

// 抽离的颜色插值工具类
class ColorInterpolator {
  static interpolateColors(fromColor: THREE.Color, toColor: THREE.Color, progress: number, targetColor: THREE.Color): void {
    // 确保 progress 在 0-1 范围内
    progress = Math.max(0, Math.min(1, progress));

    // 使用实例方法 .copy() 和 .lerp() 进行插值
    targetColor.copy(fromColor).lerp(toColor, progress);
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
  composer: EffectComposer | null = null  // 添加composer实例
  instance: ComponentInternalInstance | null;
  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.scene = scene
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    )
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true // 启用抗锯齿以提高渲染质量
    })
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
    this.camera.position.set(0, 5, -20)
    this.controls.update()
    this.controls.target = new THREE.Vector3(30,3,15)
    this.stage = new Stage("stage",themeStore.isDarkMode)
    camera = this.camera
    this.instance =  (getCurrentInstance() as ComponentInternalInstance)
    this.initScene()
    // 移除不需要的setStage方法
  }
  toggleControls(isOn: boolean){
    this.controls.enablePan = isOn
    this.controls.enableRotate = isOn
    this.controls.enableZoom = isOn
    this.controls.update()
  }
  initScene(){
    scene.add(this.camera)
  }
  setStage(){
    scene.add(this.stage.stage)
  }
  // 移除不需要的setStage方法
  getStage(){
    return this.stage
  }

  // 初始化后期处理效果
  initPostProcessing() {
    // 确保只初始化一次
    if (this.composer) {
      return;
    }

    // 创建EffectComposer时确保使用正确的参数
    this.composer = new EffectComposer(this.renderer);
    // 设置正确的尺寸
    this.composer.setSize(window.innerWidth, window.innerHeight);
    debugger
    const renderPass = new RenderPass(scene, camera);
    this.composer.addPass(renderPass);
    const moebiusPass = new MoebiusPass();
    this.composer.addPass(moebiusPass);
  }
}

let then = 0;
function updateRenderer(now: number){
  now *= 0.001;  // convert to seconds
  then = now;

  if(backCanvasRef) {
    const backCanvas = backCanvasRef
    // 使用预创建的composer进行渲染
    if (backCanvas.composer) {
      backCanvas.composer.render();
    } else {
      // 如果没有后期处理，直接渲染场景
      backCanvas.renderer.render(scene, camera);
    }
  }
}
// const canvasRef = ref<HTMLCanvasElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null);
// const backCanvasRef = ref<BackCanvas | null>(null)
let backCanvasRef = {} as BackCanvas;
const themeStore = useThemeStore()
let animationFrameId: number

onMounted(() => {
  if (canvasRef.value) {
    const backCanvas = new BackCanvas(canvasRef.value)
    backCanvasRef = backCanvas

    // 确保初始化完成后才开始渲染
    setupStage();

    // 初始化后期处理效果
    backCanvas.initPostProcessing();

    // 添加动画循环
    const animate = (now:number) => {
      // 更新控制器
      backCanvas.controls.update()
      // 更新场景
      updateStage()
      // 渲染场景
      updateRenderer(now)

      animationFrameId = requestAnimationFrame(animate)
    }
    animationFrameId = requestAnimationFrame(animate)

    // 处理窗口大小调整
    const handleResize = () => {
      if(backCanvasRef) {
        backCanvas.camera.aspect = window.innerWidth / window.innerHeight
        backCanvas.camera.updateProjectionMatrix()
        backCanvas.renderer.setSize(window.innerWidth, window.innerHeight)

        // 如果composer存在，也需要调整大小
        if (backCanvas.composer) {
          backCanvas.composer.setSize(window.innerWidth, window.innerHeight);
        }
      }
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
  const stage = backCanvasRef?.getStage() || null
  // TEST
    backCanvasRef?.toggleControls(true)
  if(stage){
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    stage.add(ambientLight,'ambient');

    stage.addColorPair("room", 0x020D45,0x0730FF)
    // Room

    const room = await loadGLB('/src/assets/model/room.glb') as THREE.Object3D
    // const roomGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const boxColor = stage.colors["room"].getColor();
    const roomMat = new THREE.MeshPhysicalMaterial({
      color: boxColor,
      side: THREE.DoubleSide,
      wireframe: false,
      transparent: true,
      opacity: 1,
      ior: 0.9,
      reflectivity: 0.8,
      metalness: 0.3,
      roughness: 0.7,
    });
    // const roomMat = new THREE.ShaderMaterial({
    //   fragmentShader: SketchOutlineShader.fragmentShader,
    //   vertexShader: SketchOutlineShader.vertexShader,
    //   uniforms: SketchOutlineShader.uniforms,
    //   // wireframe: true,
    // })
    // roomMat.uniforms.outlineThickness.value = 0.5;

    // @ts-expect-error 缺少属性
    room.material = roomMat
    // const room = new THREE.Mesh(roomGeo, roomMat);
    room.scale.set(30, 30, 30);
    room.position.set(0, 0, 0);
    room.receiveShadow = true;
    room.castShadow = true;

    stage.add(room, 'room');
    stage.addMaterial( roomMat,"room")

    const glass = new THREE.Mesh(
      new THREE.PlaneGeometry(30, 60),
      roomMat
    )

    glass.position.set(29, 12, 15);
    glass.rotation.y = -Math.PI / 2;
    stage.add(glass, 'glass');
    // light
    // const light = new THREE.SpotLight(0xffffff, 100.0 , 180.0, Math.PI / 6,0.8,100)
    const light = new THREE.DirectionalLight(0xffffff, 1.0);
    // light.scale.set(10,10,10)
    light.position.set(glass.position.x+100, glass.position.y, glass.position.z)
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
    const lightTarget = new THREE.Mesh(lightObjectGeo, lightObjectMat);
    // light.position.set(0, 5, -55)
    lightTarget.position.set(-light.position.x,light.position.y,light.position.z);
    light.target = lightTarget
    lightObject.position.set(light.position.x, light.position.y, light.position.z)
    const lightHelper = new THREE.DirectionalLightHelper(light, 5);
    // const dir = lightTarget.position.clone().sub(light.position).normalize()
    // const lightDirworldHelper = new THREE.ArrowHelper(dir,light.position, 5, 0xffffff, 1);
    stage.add(light,'light')
    stage.add(lightObject, 'lightObject');
    stage.add(lightTarget, 'lightTarget');
    stage.add(lightHelper, 'lightHelper');
    // stage.add(lightDirworldHelper, 'lightDirworldHelper');
    // stage.add(lightHelper, 'lightHelper');

    // 移除原来的室内点光源
    // const indoorLight = new THREE.PointLight(0xffffff, 50);
    // indoorLight.position.set(0, 0, 0);
    // stage.add(indoorLight, 'indoorLight');

  }
  setUpGUI()
}
function updateStage() {
  if (backCanvasRef) {
    const stage = backCanvasRef.getStage()
    if (stage) {
      // 更新所有颜色的过渡
      stage.updateColors()

      const light = stage.get('light') as THREE.DirectionalLight
      // const lightObject = stage.get('lightObject')
      // const lightHelper = stage.get('lightHelper')as THREE.DirectionalLightHelper
      // rotate around 0,0,0
      if (light) {
      //   // 使用更大的半径，并保持合适的高度，避免光源穿过模型
      //   const radius = 200; // 增加半径使光源远离中心
      //   const height = 5; // 调整高度避免穿过地面
      //   const speed = 0.2; // 降低旋转速度使动画更平滑
      //   light.position.x = radius * Math.sin(Date.now() / 1000 * speed)
      //   light.position.y = height
      //   light.position.z = radius * Math.cos(Date.now() / 1000 * speed)
      //   // 更新光源目标位置，确保光照方向正确
      //   if (light.target) {
      //     light.target.position.set(0, 0, 0);
      //   }

      }

      // lightObject?.position.copy(light?.position)
      const ambientLight = stage.get('ambient') as THREE.AmbientLight
      if (ambientLight) {
        ambientLight.intensity = ambientLight.intensity * (themeStore.isDarkMode ? 0.5 : 1)
      }

      updateUniforms()
    }
  }

}
function updateUniforms(){
  if (backCanvasRef) {
    const stage = backCanvasRef.getStage()
    if (stage) {
      const room = stage.get('room') as THREE.Mesh
      if(room){
        // const roomMat = room.material as THREE.ShaderMaterial
        // roomMat.uniforms.objectColor.value = stage.colors["room"].getColor()

        // roomMat.uniforms.lightPosition.value = light.position
        // roomMat.uniforms.resolution.value = new THREE.Vector2(window.innerWidth, window.innerHeight)
        // roomMat.uniforms.cameraNear.value = camera.near;
        // roomMat.uniforms.cameraFar.value = camera.far;
        // roomMat.needsUpdate = true


        // 更新区域光相关的uniforms
        const areaLight = stage.get('areaLight') as THREE.Mesh
        if (areaLight) {

        }
      }
    }
  }
}
function setUpGUI(){
  const gui = new GUI();
  const stage = backCanvasRef?.getStage() || null
  const marker = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: 0xffffff }));
  stage?.add(marker,"marker")
  const controller = backCanvasRef?.controls as OrbitControls
  if(controller){
    controller.target = marker.position
  }
  marker.position.lerp(new THREE.Vector3(55, 5, 30),0.5)
  gui.domElement.style.position = 'absolute';
  gui.domElement.style.top = '4rem';
  const markerFolder = gui.addFolder('Marker');
  const markerPosition = stage?.get("marker")?.position;
  if(markerPosition) {
    markerFolder.add(markerPosition, "x", -100,100,0.01);
    markerFolder.add(markerPosition, "y", -100,100,0.01);
    markerFolder.add(markerPosition, "z", -100,100,0.01);
  }

  const dirLight = stage?.get("light")
  if (dirLight) {
    const dirLightFolder = gui.addFolder('Directional Light');
    dirLightFolder.add(dirLight.position, 'x', -100,100,0.01);
    dirLightFolder.add(dirLight.position, 'y', -100,100,0.01);
    dirLightFolder.add(dirLight.position, 'z', -100,100,0.01);
    dirLightFolder.add(dirLight.rotation, 'x', -Math.PI,Math.PI,0.01);
    dirLightFolder.add(dirLight.rotation, 'y', -Math.PI,Math.PI,0.01);
    dirLightFolder.add(dirLight.rotation, 'z', -Math.PI,Math.PI,0.01);
    dirLightFolder.add((dirLight as any), 'intensity', 0, 2);
  }

  const shadersFolder = gui.addFolder('Shaders');
  const shader = stage?.getMaterial("room") as THREE.ShaderMaterial
  const color = stage?.colors["room"]
  if(color){
    shadersFolder.addColor(color, "lightColor");
    shadersFolder.addColor(color, "darkColor");
  }
}
// 监听主题变化
themeStore.$subscribe((mutation, state) => {
  if (backCanvasRef) {
    backCanvasRef.isDarkTheme = state.isDarkMode
    // 切换Stage中的所有颜色
    const stage = backCanvasRef.getStage()
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
    const boxColor = stage.colors["room"]?.getColor()
    if (boxColor) {
      materials.forEach(mat => {
        if (mat && mat instanceof THREE.MeshPhysicalMaterial) {  // 修复：应该是MeshPhysicalMaterial而不是MeshBasicMaterial
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

  // 清理资源
  if (backCanvasRef) {
    if (backCanvasRef.composer) {
      backCanvasRef.composer.dispose();
    }

    // 清理renderer
    backCanvasRef.renderer.dispose();
  }
})
</script>
