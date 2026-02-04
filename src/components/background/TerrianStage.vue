<template>
  <div>
    <canvas ref="canvasRef"></canvas>
    <div class="test-window" v-if="generatedTexture && false">
      <img :src="generatedTexture" alt="">
    </div>
  </div>
</template>
<script setup lang="ts">
import * as THREE from 'three';
import { onMounted, onUnmounted, ref, shallowRef } from 'vue';
import { useThemeStore } from '../../stores/theme.ts';
import { Terrarin } from './entities/Terrarin';
import { OrbitControls } from 'three-stdlib';
import { ColorInterpolator } from './utils/ColorInterpolator';
import { TextureGenerator } from './utils/TextureGenerator.ts';

const themeStore = useThemeStore();
const canvasRef = ref<HTMLCanvasElement | null>(null);
// 使用 shallowRef 替代 ref，避免 Vue 深层代理 Three.js 对象
const terrain = shallowRef<Terrarin | null>(null);

// 创建一个便捷的 getter 函数，这样可以直接使用 terrainRef 而不是 terrain.value
const terrainRef = () => terrain.value!;
// 保存 GLObject 引用以便在主题切换时使用
const glObjRef = shallowRef<GLObject | null>(null);
const currentTheme = ref<'light' | 'dark'>(themeStore.isDarkMode ? 'dark' : 'light');
const generatedTexture = ref<string|null>(null);
// 颜色渐变相关变量
const isColorTransitioning = ref(false);
const colorTransitionStart = ref<number>(0);
const colorTransitionDuration = 0.4; // 过渡时间 1 秒
const fromColor = new THREE.Color();
const toColor = new THREE.Color();
const currentBgColor = new THREE.Color();

// 添加地形变形相关变量
const isTerrainAnimating = ref(true);
const terrainAnimationStart = ref<number>(0);
const terrainAnimationDuration = 3.0; // 变形持续时间 3 秒
const initialMorphInfluence = 0; // 初始为平面
const targetMorphInfluence = 1; // 目标为完整地形

interface GLObject{
  scene: THREE.Scene;
  lightManager: THREE.Group;
  controls: OrbitControls;
  objects: THREE.Group;
  renderer: THREE.WebGLRenderer;
  camera: THREE.PerspectiveCamera;
}

defineOptions({
  name: 'TerrainStage'
})
function setupStage() {
  return new Promise(async (resolve) => {
    const width = 50
    const genHeight = 50;
    const lightManager = new THREE.Group();
    const objects = new THREE.Group();
    const scene = new THREE.Scene();
    const stage = new THREE.Group();
    scene.add(stage);
    const resolution = [window.innerWidth, window.innerHeight];
    const camera = new THREE.PerspectiveCamera(
      90,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set( 0, 5, 10 );
    camera.lookAt(0,0,0);
    scene.add(camera);
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.value as HTMLCanvasElement,
      antialias: true,
      alpha: true
    });

    renderer.setSize(window.innerWidth, window.innerHeight);
    terrain.value = new Terrarin(100, 30, resolution);

    const terrainMesh = terrainRef().getMesh();
    terrainMesh.castShadow = true;
    terrainMesh.receiveShadow = true;
    stage.add(terrainMesh);

    // 设置地形变形初始状态为平面 (0) - 这样动画会从平面变为地形
    terrainRef().setMorphInfluence(0);

    // 添加方向光，增强地形的立体感
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.name = 'directionalLight';
    const terrainPos = terrainMesh.position;
    terrainPos.y += genHeight * 0.2;
    directionalLight.lookAt(terrainPos);
    lightManager.add(directionalLight);
    scene.add(directionalLight);

    // 自动调整相机以适应网格
    adjustCameraToFitMesh(camera as THREE.PerspectiveCamera, terrainMesh, scene);

    directionalLight.position.set(camera.position.x, camera.position.y, camera.position.z);
    const directionalLightHelper = new THREE.DirectionalLightHelper(directionalLight, 5);
    directionalLightHelper.name = 'directionalLightHelper'
    // objects.add(directionalLightHelper);

    scene.add(objects);
    const controls = new OrbitControls(camera, canvasRef.value as HTMLCanvasElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.3;
    controls.enableZoom = false;
    controls.enableRotate = false;
    controls.rotateSpeed = 0.5;
    controls.enablePan = false;
    controls.update();
    renderer.setClearColor(0x000000, 0.0); // 黑色背景，完全透明

    const GLObj : GLObject = {
      scene,
      lightManager,
      objects,
      controls,
      renderer,
      camera,
    }
    resolve(GLObj)
  })
}

// 添加一个函数来调整相机以适应网格
function adjustCameraToFitMesh(camera: THREE.PerspectiveCamera, mesh: THREE.Mesh, scene: THREE.Scene) {
  // 计算网格的边界框
  const box = new THREE.Box3().setFromObject(mesh);
  const center = box.getCenter(new THREE.Vector3()); // 获取网格中心
  const size = box.getSize(new THREE.Vector3()); // 获取网格大小

  // 计算网格的最大尺寸
  const maxSize = Math.max(size.x, size.y, size.z);

  // 计算相机距离，以确保网格适合视野
  // 使用视野角度和网格大小来计算合适的距离
  const fov = camera.fov * (Math.PI / 180); // 转换为弧度
  let cameraDistance = maxSize / 2 / Math.tan(fov / 2);

  // 添加一点边距，确保网格完全适合视图
  cameraDistance *= 0.9;

  // 调整相机位置，使其看向网格中心
  const direction = camera.position.clone().normalize(); // 保留当前相机的方向
  camera.position.copy(direction.multiplyScalar(cameraDistance));
  camera.position.add(center);
  camera.position.y += 10;
  camera.lookAt(center);

  // 更新相机的近远裁剪面
  camera.near = maxSize / 100;
  camera.far = cameraDistance * 5;
  camera.updateProjectionMatrix();
}

function startUpStage(gl:GLObject) {
  const { scene, camera, renderer, controls, objects, lightManager} = gl;

  // 保存 GLObject 引用
  glObjRef.value = gl;

  // 初始化背景颜色
  scene.background = null;
  if (terrainRef().mask){
    generatedTexture.value = terrainRef().mask.getImage();
  }
  const animate = () => {
    requestAnimationFrame(animate);
    renderer.setClearColor(0x000000, 0.0); // 黑色背景，完全透明
    // 更新控制器状态，确保 damping 等效果生效
    controls.update();

    // 处理地形变形动画 - 使用基于高度的延迟动画
    if (isTerrainAnimating.value) {
      const currentTime = performance.now();
      const progress = ColorInterpolator.calculateProgressWithEasing(
        terrainAnimationStart.value,
        currentTime,
        terrainAnimationDuration,
        ColorInterpolator.easeInOutQuad
      );

      // 如果动画已完成，停止动画
      if (progress >= 1) {
        isTerrainAnimating.value = false;
      } else {
        // 使用基于高度的延迟动画，传递当前动画进度
        terrainRef().setMorphInfluenceWithDelay(progress, 30); // 30是maxDepth
      }
    }

    // 处理颜色渐变
    if (isColorTransitioning.value && colorTransitionStart.value !== null) {
      const currentTime = performance.now();
      const progress = ColorInterpolator.calculateProgress(
        colorTransitionStart.value,
        currentTime,
        colorTransitionDuration
      );
      // console.log(fromColor, toColor, progress);
      ColorInterpolator.interpolateColors(
        fromColor,
        toColor,
        progress,
        currentBgColor
      );

      if (glObjRef.value) {
        // glObjRef.value.scene.background = currentBgColor;
      }

      if (progress >= 1) {
        isColorTransitioning.value = false;
      }
    }

    objects.getObjectByName('directionalLightHelper')?.position.copy(camera.position);
    lightManager.getObjectByName('directionalLight')?.position.copy(camera.position);

    terrainRef().updateUniforms();
    // 渲染场景
    renderer.render(scene, camera);
  };

  // 开始地形变形动画
  isTerrainAnimating.value = true;
  terrainAnimationStart.value = performance.now();

  animate();
}

// 主题切换处理函数
function handleThemeChange(isDark: boolean) {
  const newTheme = isDark ? 'dark' : 'light';
  if (newTheme != currentTheme.value && glObjRef.value) {

    // 开始颜色过渡
    const oldTheme = currentTheme.value;
    // fromColor.copy(glObjRef.value.scene.background as THREE.Color); // 使用当前背景色作为起始色
    fromColor.copy(new THREE.Color( oldTheme === 'light' ? '#f3f4f6' : '#1e1e1e'))
    toColor.set(newTheme === 'light' ? '#f3f4f6' : '#1e1e1e');

    currentTheme.value = newTheme;
    isColorTransitioning.value = true;
    colorTransitionStart.value = performance.now();
  }
}

themeStore.$onAction((action) => {
  if(action.name === 'toggleDarkMode'){
    handleThemeChange(action.args[0]);
  }
})

onMounted(() => {
  if(canvasRef.value){
    setupStage().then((gl) =>{
      startUpStage(gl as GLObject)
    })
  }


})

onUnmounted(() => {
  const gl = glObjRef.value;
  if (gl) {
    gl.controls.dispose();
    gl.renderer.dispose();

  }
})
</script>
<style scoped>
.test-window{
  position: fixed !important;
  z-index: 9999;
  top: 0;
  right: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
</style>
